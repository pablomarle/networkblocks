const fs = require("fs");
const crypto = require("crypto");

const validator = require("./validator")
const nm_sendmail = require("./nm_sendmail")
const tools = require("./tools")

const PWD_VALID_CHARS = "1234567890@$!%*?&qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM"
const PWD_LENGTH = 12
const SALT_LENGTH = 16

const VALID_PERMISSIONS = new Set(["super_user", "users_rw", "users_ro", "ipam_rw", "ipam_ro", "assets_rw", "assets_ro", "devices_ro", "devices_rw"]);

let config = null;
let userdb = null;

function nm_session_middleware(req, res, next) {    
    let session_id = req.signedCookies[config.session_cookie];
    session_id = session_create_if_invalid(session_id);

    res.cookie(config.session_cookie, session_id, {signed: true, maxAge: config.session_duration * 1000});

    req.session_id = session_id;
    req.session = userdb.sessions[session_id];

    next();
}

function generateRandomPassword(pwdlength=PWD_LENGTH) {
    let randompwd = "";

    while(!validator.validate_password(randompwd)) {
        let randombuffer = crypto.randomBytes(pwdlength)
        randompwd = "";
        for (let x = 0; x < pwdlength; x++)
            randompwd += PWD_VALID_CHARS[randombuffer[x]%PWD_VALID_CHARS.length]
    }
    return randompwd;
}
    
function generateHash(password, salt) {
    const saltedpassword = password + salt;
    const hash = crypto.createHash('sha512');
    hash.update(saltedpassword);
    const digest = hash.digest().toString('base64');

    return digest;
}

function generateSalt(saltlength=SALT_LENGTH) {
    return generateRandomPassword(saltlength);
}

function isValidPassword(password) {
    if(password.length > 64)
        return false;

    for(let x = 0; x < password.length; x++)
        if(PWD_VALID_CHARS.indexOf(password[x]) == -1)
            return false

    return true
}

function session_create_if_invalid(session_id) {
    if(session_id in userdb.sessions) {
        // The provided session exists.
        userdb.sessions[session_id].last_seen = Date.now();
        return session_id;
    }
    else {
        let new_session_id = crypto.randomBytes(32).toString('hex');
        userdb.sessions[new_session_id] = {
            "user": null,
            "last_seen": Date.now(),
            "created": Date.now(),
            "data": {},
        }
        return new_session_id;
    }
}

function session_cleanup() {
    let current_time = Date.now();

    for(let session_id in userdb.sessions) {
        if(userdb.sessions[session_id].last_seen + (config.session_duration*1000) < current_time) {
            delete userdb.sessions[session_id];
        }
    }
}

function get_session_data(req) {
    let session_id = req.session_id;
    if(session_id in userdb.sessions)
        return userdb.sessions[session_id];

    return null;
}

function logout(session_id) {
    if(!(session_id in userdb.sessions))
        return "Invalid session";

    let session = userdb.sessions[session_id];
    if(!session.user)
        return "Already logged out."

    session.user = null;
    session.data = {};
}

function create_user(email, password, name, lastname) {
    if(!validator.validate_email(email))
        return "Invalid email address.";

    email = email.toLowerCase();

    if(email in userdb.users)
        return "User already exists.";
    if(!validator.validate_name(name))
        return "Invalid name";
    if(!validator.validate_name(lastname))
        return "Invalid last name.";
    if(!validator.validate_password(password))
        return "Invalid password.";

    let salt = generateSalt();
    let hash = generateHash(password, salt);

    userdb.users[email] = {
        name: name,
        lastname: lastname,
        groups: [],
        hash: hash,
        salt: salt,
        active: true,
    }
}

function activate_user(email, active) {
    if(!validator.validate_email(email))
        return "Invalid username.";

    email = email.toLowerCase();

    if(!(email in userdb.users))
        return "Invalid username.";

    if(email === config.initial_admin_email)
        return("Can't change initial admin user");

    if(typeof active !== "boolean")
        return "Invalid activate option";

    userdb.users[email].active = active;

    if(active === false) {
        // Logout sessions where this user is active.
        for(let session_id in userdb.sessions) {
            if(userdb.sessions[session_id].user === email) {
                userdb.sessions[session_id].user = null;
                userdb.sessions[session_id].data = {};
            }
        }
    }
}

function change_user_details(email, name, lastname) {
    if(!validator.validate_email(email))
        return "Invalid username.";
    email = email.toLowerCase();

    if(!(email in userdb.users))
        return "Invalid username.";
    if(email === config.initial_admin_email)
        return("Can't change initial admin user groups");
    if(!validator.validate_name(name))
        return "Invalid name";
    if(!validator.validate_name(lastname))
        return "Invalid last name.";

    let user = userdb.users[email];
    user.name = name;
    user.lastname = lastname;
}

function change_user_password(email, old_password, new_password) {
    if(!validator.validate_email(email))
        return "Invalid username or password.";
    email = email.toLowerCase();

    if(!(email in userdb.users))
        return "Invalid username or password.";
    if(!validator.validate_password(old_password))
        return "Invalid old password.";
    if(!validator.validate_password(new_password))
        return "Invalid new password.";

    let user = userdb.users[email];
    let old_hash = generateHash(old_password, user.salt);
    if(old_hash !== user.hash)
        return "Invalid username or password.";

    let new_salt = generateSalt();
    let new_hash = generateHash(new_password, new_salt);
    user.hash = new_hash;
    user.salt = new_salt;
}

function reset_user_password(email) {
    if(!validator.validate_email(email))
        return "Invalid email address.";
    email = email.toLowerCase();

    if(!(email in userdb.users))
        return "User does not exist.";

    let password = generateRandomPassword();
    let salt = generateSalt();
    let hash = generateHash(password, salt);
    userdb.users[email].hash = hash;
    userdb.users[email].salt = salt;

    nm_sendmail.send_email(email, "Your NetworkBlocks account password has been reset.",
        `${userdb.users[email].name} ${userdb.users[email].lastname}\n\nYour account password has been reset.\nUsername: ${email}\nPassword: ${password}\nURL: ${config.server_url}\n\nRegards.`);
}

function change_user_groups(email, groups, is_initial=false) {
    if(!validator.validate_email(email))
        return "Invalid email address.";
    email = email.toLowerCase();

    if(!(email in userdb.users))
        return "User does not exist.";
    if((email === config.initial_admin_email) && (!is_initial))
        return("Can't change initial admin user groups");
    if(!Array.isArray(groups))
        return "Invalid group list";
    for(let i = 0; i < groups.length; i++)
        if(!(groups[i] in userdb.groups))
            return "Invalid group list";

    userdb.users[email].groups = groups;
}

function create_group(name, description) {
    if(!validator.validate_name(name))
        return ["Invalid name", null];

    if(!validator.validate_description(description))
        return ["Invalid description", null];

    for(let group_id in userdb.groups) {
        if(userdb.groups[group_id].name === name)
            return ["Name already exists", null];
    }

    let group_id = tools.generate_id(userdb.groups);
        
    userdb.groups[group_id] = {
        name: name,
        description: description,
        permissions: [],
    }

    return [null, group_id];
}

function update_group_permissions(id, new_permissions, is_initial=false) {
    if(!(id in userdb.groups))
        return "Invalid group";

    if((userdb.groups[id].name === "GlobalAdmin") && (!is_initial))
        return "Can't change Global Admin group";
    if(!Array.isArray(new_permissions))
        return "Invalid permission list";

    for(let i = 0; i < new_permissions.length; i++) {
        if(!VALID_PERMISSIONS.has(new_permissions[i]))
            return `Permission ${new_permissions[i]} is invalid`;
    }

    userdb.groups[id].permissions = Array.from(new Set(new_permissions));
}

function update_group(id, new_name, new_description) {
    if(!(id in userdb.groups))
        return "Invalid group";

    if(userdb.groups[id].name === "GlobalAdmin")
        return "Can't change Global Admin group";
    
    if(new_name === "GlobalAdmin")
        return "Reserved name";

    if(!validator.validate_name(new_name))
        return "Invalid name";

    if(!validator.validate_description(new_description))
        return "Invalid description";

    for(let group_id in userdb.groups) {
        if(userdb.groups[group_id].name === new_name)
            return "Name already exists";
    }

    userdb.groups[id].name = new_name;
    userdb.groups[id].description = new_description;
}

function delete_group(id) {
    if(!(id in userdb.groups))
        return "Invalid group";

    if(userdb.groups[id].name === "GlobalAdmin")
        return "Can't change Global Admin group";

    delete userdb.groups[id];

    // Remove permission from groups
    for(let email in userdb.users) {
        let i = userdb.users[email].groups.indexOf(id);
        if(i !== -1)
            userdb.users[email].groups.splice(i, 1);
    }
}


/* **************************************************
 * This function checks if a request comes from a
 * user with valid permissions, or the user is in the users_allowed list
 */
function is_user_allowed(req, permissions, users_allowed = []) {
    let session = userdb.sessions[req.session_id];
    if(!session) {
        tools.log("User", `Invalid session: ${req.session_id}`)
        return null;
    }

    if(!session.user) {
        tools.log("User", `Session not logged in: ${req.session_id}`)
        return null;
    }

    if(!(session.user in userdb.users)) {
        tools.log("User", `Session ${req.session_id} with invalid user: ${session.user}`);
    }

    // Check if the session user is in the users_allowed list
    for(let user of users_allowed) {
        if(user === session.user)
            return session.user;
    }

    for(let i = 0; i < userdb.users[session.user].groups.length; i++) {
        let group_id = userdb.users[session.user].groups[i];

        if(!(group_id in userdb.groups))
            continue;
        if(userdb.groups[group_id].permissions.indexOf("super_user") !== -1)
            return session.user;

        for(let i = 0; i < permissions.length; i++) {
            let permission = permissions[i];
            if(userdb.groups[group_id].permissions.indexOf(permission) !== -1)
                return session.user;
        }
    }

    tools.log("is_user_allowed", `${req.session_id} User ${session.user} not allowed.`);
    return null;
}

/* **************************************************
 * Get a list of all users with it's viewable properties
 * Requires super_user, users_rw, or users_ro permission
 */
function view_users_list(req, res) {
    if(!is_user_allowed(req, ["users_rw", "users_ro"]))
        return res.status(403).json({error: "You are not authorized."})

    let result = {};
    for(let email in userdb.users)
        result[email] = {
            name: userdb.users[email].name,
            lastname: userdb.users[email].lastname,
            groups: userdb.users[email].groups,
            active: userdb.users[email].active,
        }
    res.status(200).json(result);
}

/* **************************************************
 * Get user data.
 * Requires super_user, users_rw, or users_ro permission
 */
function view_users_get(req, res) {
    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})
    let email = req.body.email;

    if(!is_user_allowed(req, ["users_rw", "users_ro"], [email]))
        return res.status(403).json({error: "You are not authorized."})

    if(!(email in userdb.users))
        return res.status(404).json({error: "User not found."})

    let groups = {}
    for(let group_id of userdb.users[email].groups) {
        groups[group_id] = userdb.groups[group_id].name;
    }

    let result = {
        name: userdb.users[email].name,
        lastname: userdb.users[email].lastname,
        groups: groups,
        active: userdb.users[email].active,
    }
    return res.status(200).json(result);
}

/* **************************************************
 * Add a user.
 * Requires super_user or users_rw permission
 * Parameters: email, name, lastname
 */
function view_users_add(req, res) {
    if(!is_user_allowed(req, ["users_rw"]))
        return res.status(403).json({error: "You are not authorized."})

    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    let password = generateRandomPassword();

    let result = create_user(req.body.email, password, req.body.name, req.body.lastname);

    if(result) {
        // There was an error
        tools.log("view_users_add", `${req.session_id} User '${req.body.email}' add failed: ${result}`)
        return res.status(400).json({error: result});
    }

    nm_sendmail.send_email(req.body.email, "Your NetworkBlocks account has been created.",
        `${req.body.name} ${req.body.lastname}\n\nAn account has been created for you.\nUsername: ${req.body.email}\nPassword: ${password}\nURL: ${config.server_url}\n\nRegards.`);

    tools.log("view_users_add", `${req.session_id} User added: '${req.body.email}'`)
    res.status(200).json({});
}

/* **************************************************
 * Deactivates a user
 * Requires super_user or users_rw permission
 * Parameters: email, active
 */
function view_users_activate(req, res) {
    if(!is_user_allowed(req, ["users_rw"]))
        return res.status(403).json({error: "You are not authorized."})

    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    let result = activate_user(req.body.email, req.body.active);

    if(result) {
        // There was an error
        tools.log("view_users_activate", `${req.session_id} Failed de/activation of ${req.body.email}: ${result}`)
        return res.status(400).json({error: result});
    }

    nm_sendmail.send_email(req.body.email, `Your NetworBlocks account has been ${(req.body.active) ? "activated" : "suspended"}.`,
        `Your NetworkBlocks account has been ${(req.body.active) ? "activated" : "suspended"}.`);

    tools.log("view_users_activate", `${req.session_id} active = ${req.body.active} of ${req.body.email}.`)
    res.status(200).json({});
}

/* **************************************************
 * Change parameters of a user (name and lastname)
 * Requires super_user or users_rw permission
 * Parameters: 
 * - email
 * - name
 * - lastname
 */
function view_users_update(req, res) {
    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    if(!is_user_allowed(req, ["users_rw"]) && (req.body.email !== userdb.sessions[req.session_id].user))
        return res.status(403).json({error: "You are not authorized."})

    let result = change_user_details(req.body.email, req.body.name, req.body.lastname);

    if(result) {
        // There was an error
        tools.log("view_users_update", `${req.session_id} Failed update of ${req.body.email}: ${result}`);
        return res.status(400).json({error: result});
    }

    tools.log("view_users_update", `${req.session_id} User ${req.body.email} Updated: ${req.body.name} ${req.body.lastname}`);
    res.status(200).json({});
}

/* **************************************************
 * Change password of a user
 * No permission is required (just the old password)
 * Parameters: 
 * - email
 * - old_password
 * - new_password
 */
function view_users_password(req, res) {
    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    let result = change_user_password(req.body.email, req.body.old_password, req.body.new_password);

    if(result) {
        // There was an error
        tools.log("view_users_password", `${req.session_id} Failed password change of ${req.body.email}: ${result}`);
        return res.status(400).json({error: result});
    }

    tools.log("view_users_password", `${req.session_id} Password changed of ${req.body.email}`);
    res.status(200).json({});
}

/* **************************************************
 * Reset password of a user
 * Requires users_rw permission (or super_user)
 * Parameters: 
 * - email
 * - old_password
 * - new_password
 */
function view_users_passwordreset(req, res) {
    if(!is_user_allowed(req, ["users_rw"]))
        return res.status(403).json({error: "You are not authorized."})

    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    let result = reset_user_password(req.body.email);

    if(result) {
        // There was an error
        tools.log("view_users_passwordreset", `${req.session_id} Failed password reset of ${req.body.email}: ${result}`);
        return res.status(400).json({error: result});
    }

    tools.log("view_users_password", `${req.session_id} Password reset of ${req.body.email}`);
    res.status(200).json({});
}

/* **************************************************
 * Change groups a user belongs to
 * Requires users_rw permission (or super_user)
 * Parameters: 
 * - email
 * - groups: list of groups the user belongs to
 */
function view_users_groups(req, res) {
    if(!is_user_allowed(req, ["users_rw"]))
        return res.status(403).json({error: "You are not authorized."})

    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    let result = change_user_groups(req.body.email, req.body.groups);

    if(result) {
        // There was an error
        return res.status(400).json({error: result});
    }

    res.status(200).json({});
}

/* **************************************************
 * Login user.
 * Parameters:
 * - username
 * - password
 */
function view_login(req, res) {
    let session = userdb.sessions[req.session_id];
    if(!session) {
        tools.log("view_login", `${req.session_id} Invalid session.`)
        return res.status(400).json({error: "Invalid session."});
    }

    if(session.user) {
        tools.log("view_login", `${req.session_id} Session already logged in.`)
        return res.status(400).json({error: "Already logged in."})
    }

    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    if(!validator.validate_email(req.body.username))
        return res.status(400).json({error: "Invalid email address."})

    let username = req.body.username.toLowerCase();
    let user = userdb.users[username];
    let password = req.body.password;

    if((!user) || (!user.active)) {
        tools.log("view_login", `${req.session_id} Invalid user: '${username}'`)
        return res.status(400).json({error: "Invalid username or password."})
    }

    if(generateHash(password, user.salt) !== user.hash) {
        tools.log("view_login", `${req.session_id} Invalid password: '${username}'`)
        return res.status(400).json({error: "Invalid username or password."})
    }

    session.user = username;
    session.data.user = {
        name: user.name,
        lastname: user.lastname,
        user: username,
    }
    res.status(200).json({});

    tools.log("view_login", `${req.session_id} User logged in: ${username}`)
}

/* **************************************************
 * Logout a user.
 * Parameters: none
 */
function view_logout(req, res) {
    let result = logout(req.session_id);
    if(result) {
        tools.log("view_logout", `${req.session_id} logout failed: ${result}`)
        return res.status(400).json({error: result});
    }
    else
        return res.status(200).json({});
}

/* **************************************************
 * List all groups.
 * Parameters: none
 */
function view_groups_list(req, res) {
    if(!is_user_allowed(req, ["users_rw", "users_ro"])) 
        return res.status(403).json({error: "You are not authorized."})

    let result = {};
    for(let id in userdb.groups)
        result[id] = {
            name: userdb.groups[id].name,
            description: userdb.groups[id].description,
            permissions: userdb.groups[id].permissions,
        }

    res.status(200).json(result);
}

/* **************************************************
 * Create a new group
 * Parameters:
 * - name
 * - description
 */
function view_groups_add(req, res) {
    if(!is_user_allowed(req, ["users_rw"]))
        return res.status(403).json({error: "You are not authorized."})

    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    let [err, group_id] = create_group(req.body.name, req.body.description);

    if(err) {
        // There was an error
        tools.log("view_groups_add", `${req.session_id} Group ${req.body.name} create failed: ${err}`);
        return res.status(400).json({error: err});
    }

    tools.log("view_groups_add", `${req.session_id} Group ${req.body.name} (${group_id}) created.`);
    res.status(200).json({id: group_id});
}

/* **************************************************
 * Delete a group
 * Parameters:
 * - id
 */
function view_groups_delete(req, res) {
    if(!is_user_allowed(req, ["users_rw"]))
        return res.status(403).json({error: "You are not authorized."})

    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    let result = delete_group(req.body.id);

    if(result) {
        // There was an error
        tools.log("view_groups_delete", `${req.session_id} Group ${req.body.id} delete failed: ${result}`);
        return res.status(400).json({error: result});
    }

    tools.log("view_groups_delete", `${req.session_id} Group ${req.body.id} deleted.`);
    res.status(200).json({});
}

/* **************************************************
 * Modifies the name and description of a group
 * Parameters:
 * - id
 * - name
 * - description
 */
function view_groups_update(req, res) {
    if(!is_user_allowed(req, ["users_rw"]))
        return res.status(403).json({error: "You are not authorized."})

    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    let result = update_group(req.body.id, req.body.name, req.body.description);

    if(result) {
        // There was an error
        tools.log("view_groups_update", `${req.session_id} Group ${req.body.id} update failed: ${result}`);
        return res.status(400).json({error: result});
    }

    tools.log("view_groups_update", `${req.session_id} Group ${req.body.id} updated.`);
    res.status(200).json({});
}

/* **************************************************
 * Modifies the permissions of a group
 * Parameters:
 * - id
 * - permissions
 */
function view_groups_permissions(req, res) {
    if(!is_user_allowed(req, ["users_rw"]))
        return res.status(403).json({error: "You are not authorized."})

    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    let result = update_group_permissions(req.body.id, req.body.permissions);

    if(result) {
        // There was an error
        tools.log("view_groups_permissions", `${req.session_id} Group ${req.body.id} permissions failed: ${result}`);
        return res.status(400).json({error: result});
    }

    tools.log("view_groups_permissions", `${req.session_id} Group ${req.body.id} permissions changed: ${req.body.permissions}`);
    res.status(200).json({});
}

function setup_routes(app) {
    app.get('/api/users', view_users_list);
    app.post('/api/users/get', view_users_get);
    app.post('/api/users/add', view_users_add);
    app.post('/api/users/activate', view_users_activate);
    app.post('/api/users/update', view_users_update);
    app.post('/api/users/password', view_users_password);
    app.post('/api/users/password_reset', view_users_passwordreset);
    
    app.post('/api/users/groups', view_users_groups);

    app.post('/api/users/login', view_login);
    app.post('/api/users/logout', view_logout);

    app.get('/api/groups', view_groups_list);
    app.post('/api/groups/add', view_groups_add);
    app.post('/api/groups/delete', view_groups_delete);
    app.post('/api/groups/update', view_groups_update);
    app.post('/api/groups/permissions', view_groups_permissions);
}

/* **************************************************
 * Initialization function. Load the database or, if
 * it doesn't exists, it creates it. It also start 
 * the process of saving it periodically.
 */
function initialize(app_config) {
    config = app_config;

    // Read the user database
    try {
        let data = fs.readFileSync(config.userdb);
        try {
            userdb = JSON.parse(data);
        }
        catch (e) {
            throw new Error("Failed to parse userdb file: " + config.userdb);
        }
    }
    catch (e) {
        let id;
        tools.log("UserDB", `Failed to open ${ config.userdb } as userdb: ${e.message}`);
        tools.log("UserDB", "*****************************************************")
        tools.log("UserDB", `Creating empty userdb.`);
        userdb = {
            version: 1,
            users: {},
            groups: {},
            sessions: {},
        };

        // Create the default admin user
        let err = create_user(config.initial_admin_email, "Admin123$", "Administrator", " ");
        if(err)
            throw "Couldn't create admin user: " + err;
        [err, id] = create_group("GlobalAdmin", "Default global administrators");
        if(err)
            throw "Couldn't create admin user: " + err;
        err = change_user_groups(config.initial_admin_email, [id], true);
        if(err)
            throw "Couldn't create admin user: " + err;
        err = update_group_permissions(id, ["super_user"], true);
        if(err)
            throw "Couldn't create admin user: " + err;

        tools.log("UserDB", `Admin user: ${config.initial_admin_email}\nAdmin password: Admin123$\nPlease, change the password as soon as possible.`);
        tools.log("UserDB", "*****************************************************\n")
        tools.log("UserDB", userdb);
    }


    setInterval(() => {
        tools.log("UserDB Save", "Saving userdb...");
        fs.writeFile(config.userdb, JSON.stringify(userdb), (err) => {
            if(err)
                tools.log("UserDB Save", `Failed to write userdb file to ${ config.userdb }: ${err}`);
            else
                tools.log("UserDB Save", `Userdb saved.`)
        })
    }, config.timers.write_userdb * 1000);

    setInterval(() => {
        session_cleanup();
    }, config.timers.session_cleanup * 1000);

    // Initialize nm_sendmail
    nm_sendmail.initialize(app_config);
}

module.exports = {
    initialize: initialize,
    setup_routes: setup_routes,
    nm_session_middleware: nm_session_middleware,
    logout: logout,
    get_session_data: get_session_data,
    is_user_allowed: is_user_allowed,
  
    userdb: () => {return userdb},
};