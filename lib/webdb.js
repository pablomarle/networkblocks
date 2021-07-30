const fs = require("fs");
const model_definition = require("./model_definition");
const tools = require("./tools")
const validator = require("./validator")

let config = null;
let db = null;
let USER = null;

let reverse_references = {};

function create_base_entry(user, fields, custom_fields) {
    let timestamp = Date.now();
    let new_entry = {
        fields: fields, 
        custom_fields: custom_fields, 
        created_by: user, 
        last_modified_by: user,
        created: timestamp, 
        last_modified: timestamp,
    };
    return new_entry;
}

function not_in_set(set_src, set_target) {
    return [...set_src].filter(x => !set_target.has(x))
}

function migrate_db() {
    tools.log("DBMigration", "Starting.")
    // Create documents and elements root if they don't exist
    if(!("documents" in db))
        db.documents = {};

    if(!("keys" in db))
        db.keys = {};

    // Make sure db has all keys in modeldefinition
    let model_keys = new Set(Object.keys(model_definition.keys));
    let db_keys = new Set(Object.keys(db.keys));

    let toadd_keys = not_in_set(model_keys, db_keys)

    for(let key of toadd_keys) {
        tools.log("DBMigration", `Creating key ${key}`);
        db.keys[key] = {};

        // Create the static entries (entries that can't be removed) and initial entries.
        for(let entry_type of ["static_entries", "initial_entries"]) {
            if(entry_type in model_definition.keys[key]) {
                for(let static_element_key in model_definition.keys[key][entry_type]) {
                    db.keys[key][static_element_key] = create_base_entry(
                        config.initial_admin_email,
                        tools.deep_copy_json(model_definition.keys[key][entry_type][static_element_key]),
                        {});
                    tools.log("DBMigration", `Creating element ${static_element_key} in key ${key}`);
                }
            }
        }
    }

    // Remove keys in db that don't exist in modeldefinition
    let toremove_keys = not_in_set(db_keys, model_keys);
    for(let key of toremove_keys) {
        tools.log("DBMigration", `Removing key ${key}`);
        delete db.keys[key];
    }

    // Now, for each key, we review that all elements have the right fields
    for(let key in model_definition.keys) {
        let key_definition = model_definition.keys[key];
        let key_fields = new Set(Object.keys(key_definition.fields));

        for(let element_id in db.keys[key]) {
            let element = db.keys[key][element_id];
            let element_fields = new Set(Object.keys(element.fields));

            // Add missing fields
            let missing_fields = not_in_set(key_fields, element_fields);
            for(let field of missing_fields) {
                tools.log("DBMigration", `Adding field ${field} to ${key} ${element_id}`);

                if(["string", "email", "text", "name"].indexOf(key_definition.fields[field].type) !== -1) {
                    element.fields[field] = ("default" in  key_definition.fields[field]) ? key_definition.fields[field].default : "";
                }
                else if(key_definition.fields[field].type === "reference") {
                    element.fields[field] = null;
                }
                else if(["documents", "links"].indexOf(key_definition.fields[field].type) !== -1) {
                    element.fields[field] = [];
                }
                else if(key_definition.fields[field].type === "number") {
                    element.fields[field] = ("default" in  key_definition.fields[field]) ? key_definition.fields[field].default : 0;
                }
                else if(key_definition.fields[field].type === "mac_address") {
                    element.fields[field] = ("default" in  key_definition.fields[field]) ? key_definition.fields[field].default : "00:00:00:00:00:00";
                }
                else {
                    throw new Error(`Unknown field type ${key_definition.fields[field].type} adding field ${field} to ${key} ${element_id}`)
                }
            }

            // Remove non-existent fields
            let extra_fields = not_in_set(element_fields, key_fields);
            for(let field of extra_fields) {
                tools.log("DBMigration", `Removing field ${field} to ${key} ${element_id}`);
                delete element.fields[field];
            }
        }
    }

    tools.log("DBMigration", "Finished.")
}

function create_reverse_reference(key, element_id, field_name, referenced_key, referenced_id) {
    if(!(referenced_id in reverse_references[referenced_key]))
        reverse_references[referenced_key][referenced_id] = [];

    reverse_references[referenced_key][referenced_id].push({key: key, element_id: element_id, field_name: field_name})
}

function remove_reverse_reference(key, element_id, field_name, referenced_key, referenced_id) {
    if(referenced_id in reverse_references[referenced_key]) {
        for(let x = 0; x < reverse_references[referenced_key][referenced_id].length; x++) {
            let reference_entry = reverse_references[referenced_key][referenced_id][x];
            if((reference_entry.key == key)
                && (reference_entry.element_id == element_id)
                && (reference_entry.field_name === field_name)) {
                    reverse_references[referenced_key][referenced_id].splice(x, 1);
                    return;
                }
        }
    }
}

function generate_reverse_references() {
    for(let key in model_definition.keys) {
        reverse_references[key] = {};
    }

    for(let key in model_definition.keys) {
        let model = model_definition.keys[key];
        for(let field_name in model.fields) {
            if(model.fields[field_name].type === "reference") {
                let referenced_key = model.fields[field_name].referenced_key;

                // Find elements referencing others
                for(let element_id in db.keys[key]) {
                    if(db.keys[key][element_id].fields[field_name] !== null) {
                        let referenced_id = db.keys[key][element_id].fields[field_name];
                        create_reverse_reference(key, element_id, field_name, referenced_key, referenced_id);
                    }
                }        
            }
        }
    }
}

function validate_element_field(key, element_id, field_name, value) {
    let model = model_definition.keys[key];
    if(!model)
        return `Invalid key '${key}'`;

    let field_model = model.fields[field_name];
    if(!field_model)
        return `Invalid field '${field_name}'`;

    if(["string", "name", "text", "email", "mac_address"].indexOf(field_model.type) !== -1) {
        if(!(typeof value === "string"))
            return `Field '${field_name}' value invalid.`;

        // Check if object needs to be unique
        if(field_model.unique) {
            for(let other_element_id in db.keys[key]) {
                if((element_id !== other_element_id) && (db.keys[key][other_element_id].fields[field_name] === value))
                    return `Field '${field_name}' duplicated.`;
            }
        }

        // Validate the field
        if(field_model.type === "text") {
            if(!validator.validate_description(value)) {
                return `Field '${field_name}' value invalid.`;
            }
        }
        else if(field_model.type === "name") {
            if(!validator.validate_name(value)) {
                return `Field '${field_name}' value invalid.`;
            }
        }
        else if(field_model.type === "email") {
            if((value !== "") && (!validator.validate_email(value))) {
                return `Field '${field_name}' value invalid.`;
            }
        }
        else if(field_model.type === "mac_address") {
            if(!validator.validate_mac_address(value)) {
                return `Field '${field_name}' value invalid.`;
            }
        }
        else {
            if(!validator.validate_string(value)) {
                return `Field '${field_name}' value invalid.`;
            }
        }
    }
    else if(field_model.type === "number") {
        if(!(typeof value === "number"))
            return `Field '${field_name}' value invalid.`;
    }
    else if(field_model.type === "reference") {
        let referenced_key = field_model.referenced_key;

        // Check if field is null and it can't be or if the 
        if((value === null) && (!field_model.null)) {
            return `Field '${field_name}' can't be null.`;
        }
        else if((value !== null) && (!(value in db.keys[referenced_key])) ) {
            return `Field '${field_name}' points to nonexistent entry.`;
        }
    }
    else if(field_model.type === "links") {
        if(!Array.isArray(value)) {
            return `Field '${field_name}' should be a list.`;
        }
        for(let link_entry of value) {
            if(!validator.validate_name(link_entry.name))
                return `Field '${field_name}' entry '${JSON.stringify(link_entry)}' name is invalid.`;

            else if(!validator.validate_url(link_entry.url))
                return `Field '${field_name}' entry '${JSON.stringify(link_entry)}' url is invalid.`;
        }
    }
    else if(field_model.type === "links") {
        if(!(typeof value === "number"))
            return `Field '${field_name}' value invalid.`;
    }
    else {
        return `Field '${field_name}' is of unknown type.`;
    }
}

function view_get_key_list(req, res) {
    // Check if key exists
    if(!(req.params.key in model_definition.keys))
        return res.status(404).json({"error": "Not found"});

    let key = req.params.key;
    let model = model_definition.keys[key];

    // Check if user is allowed
    let user = USER.is_user_allowed(req, model.permissions.ro);
    if(!user)
        return res.status(403).json({error: "You are not authorized."});

    res.status(200).json(db.keys[key]);
}

function view_get_key_element(req, res) {
    // Check if key exists
    if(!(req.params.key in model_definition.keys))
        return res.status(404).json({"error": "Not found"});

    let key = req.params.key;
    let element_id = req.params.element_id
    let model = model_definition.keys[key];

    // Check if user is allowed
    let user = USER.is_user_allowed(req, model.permissions.ro);
    if(!user)
        return res.status(403).json({error: "You are not authorized."});

    if(!(element_id in db.keys[key]))
        return res.status(404).json({"error": "Not found"});

    res.status(200).json(db.keys[key][element_id]);
}

function view_new_key_element(req, res) {
    // Check if key exists
    if(!(req.params.key in model_definition.keys))
        return res.status(404).json({"error": "Not found"});

    let key = req.params.key;
    let model = model_definition.keys[key];

    // Check if user is allowed
    let user = USER.is_user_allowed(req, model.permissions.rw);
    if(!user)
        return res.status(403).json({error: "You are not authorized."});

    // Check if this is a valid api call.
    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    // Create new entry
    let fields = {};
    let new_id = tools.generate_id(db.keys[key]);
    let references = [];

    for(let field_name in model.fields) {
        let field_model = model.fields[field_name];

        if(["string", "name", "text", "email", "number", "mac_address"].indexOf(field_model.type) !== -1) {
            // Get value of field
            if(field_name in req.body) {
                fields[field_name] = req.body[field_name];
            }
            else if("default" in field_model) {
                fields[field_name] = field_model.default;
            }
            else
                return res.status(400).json({error: `Field '${field_name}' is mandatory.`})

            // Validate field
            let validate_result = validate_element_field(key, null, field_name, fields[field_name]);
            if(validate_result)
                return res.status(400).json({error: validate_result});
        }
        else if(field_model.type === "reference") {
            if(field_name in req.body) {
                fields[field_name] = req.body[field_name];
            }
            else if("default" in field_model) {
                fields[field_name] = field_model.default;
            }
            else
                fields[field_name] = null;

            // Validate field
            let validate_result = validate_element_field(key, null, field_name, fields[field_name]);
            if(validate_result)
                return res.status(400).json({error: validate_result});

            if(fields[field_name] != null) {
                references.push({
                    key: key,
                    element_id: new_id,
                    field_name: field_name,
                    referenced_key: field_model.referenced_key,
                    referenced_id: req.body[field_name],
                })
            }
        }
        else if(field_model.type === "documents") {
            fields[field_name] = [];
        }
        else if(field_model.type === "links") {
            fields[field_name] = [];

            if(field_name in req.body) {
                // Validate field
                let validate_result = validate_element_field(key, null, field_name, req.body[field_name]);
                if(validate_result)
                    return res.status(400).json({error: validate_result});

                // Copy field data
                for(let link_entry of req.body[field_name]) {
                    fields[field_name].push({name: link_entry.name, url: link_entry.url});
                }
            }
        }
        else {
            return res.status(400).json({error: `Field '${field_name}' is of unknown type.`});
        }
    }

    db.keys[key][new_id] = create_base_entry(user, fields, {});

    // Create reverse references
    for(let reference_entry of references) {
        create_reverse_reference(reference_entry.key,
            reference_entry.element_id,
            reference_entry.field_name,
            reference_entry.referenced_key,
            reference_entry.referenced_id);
    }

    tools.log("view_new_key_element", `${req.session_id} ${user} created ${key} ${new_id}: ${JSON.stringify(db.keys[key][new_id])}`)
    res.status(200).json({id: new_id, data: db.keys[key][new_id]});
}

function view_update_key_element(req, res) {
    // Check if key exists
    if(!(req.params.key in model_definition.keys))
        return res.status(404).json({"error": "Not found"});

    let key = req.params.key;
    let element_id = req.params.element_id
    let model = model_definition.keys[key];

    // Check if user is allowed
    let user = USER.is_user_allowed(req, model.permissions.rw);
    if(!user)
        return res.status(403).json({error: "You are not authorized."});

    if(!(element_id in db.keys[key]))
        return res.status(404).json({"error": "Not found"});

    if(typeof req.body.fields === "object") {
        // Check all fields in request are OK
        for(let field_name in req.body.fields) {
            let validate_result = validate_element_field(key, element_id, field_name, req.body.fields[field_name]);
            if(validate_result)
                return res.status(400).json({error: validate_result});
        }

        // Copy all fields in request
        let element = db.keys[key][element_id];

        for(let field_name in req.body.fields) {
            let field_model = model.fields[field_name];

            if(["string", "name", "text", "email", "number", "mac_address"].indexOf(field_model.type) !== -1) {
                element.fields[field_name] = req.body.fields[field_name];
            }
            else if(field_model.type === "reference") {
                if(element.fields[field_name] !== null)
                    remove_reverse_reference(key, element_id, field_name, field_model.referenced_key, element.fields[field_name]);

                element.fields[field_name] = req.body.fields[field_name];

                if(req.body.fields[field_name] !== null)
                    create_reverse_reference(key, element_id, field_name, field_model.referenced_key, element.fields[field_name]);
            }
            else if(field_model.type === "links") {
                element.fields[field_name] = [];

                for(let link_entry of req.body.fields[field_name]) {
                    element.fields[field_name].push({name: link_entry.name, url: link_entry.url});
                }
            }
        }
        tools.log("view_update_key_element", `User '${user}' modified element '${key}' '${element_id}'.`);
        element.last_modified = Date.now();
        element.last_modified_by = user;
        return res.status(200).json(db.keys[key][element_id]);
    }
    else {
        return res.status(400).json({"error": "Invalid request (no 'fields')"});
    }
}

function view_delete_key_element(req, res) {
    // Check if key exists
    if(!(req.params.key in model_definition.keys))
        return res.status(404).json({"error": "Not found"});

    let key = req.params.key;
    let element_id = req.params.element_id
    let model = model_definition.keys[key];

    // Check if user is allowed
    let user = USER.is_user_allowed(req, model.permissions.rw);
    if(!user)
        return res.status(403).json({error: "You are not authorized."});

    // Check if element_id exists
    if(!(element_id in db.keys[key])) {
        return res.status(404).json({"error": "Not found"});
    }

    // Check if element_id is a static_entry
    if(("static_entries" in model) && (element_id in model.static_entries)) {
        return res.status(400).json({"error": "Element is static."});
    }

    // Check if element can be removed (It is not referenced by anything).
    if((element_id in reverse_references[key]) && (reverse_references[key][element_id].length > 0)) {
        return res.status(400).json({"error": "Element is referenced.", referenced_by: reverse_references[key][element_id]});
    }

    // Remove all reverse references
    for(let field_name in model.fields) {
        if((model.fields[field_name].type === "reference") && (db.keys[key][element_id].fields[field_name] !== null)) {
            remove_reverse_reference(key, element_id, field_name, 
                model.fields[field_name].referenced_key, db.keys[key][element_id].fields[field_name]);
        }
    }

    // Remove the element
    tools.log("view_delete_key_element", `User '${user}' removed element '${key}' '${element_id}'.`)
    delete db.keys[key][element_id];
    return res.status(200).json({});
 }

function setup_routes(app) {
    app.get("/api/db/:key", view_get_key_list);
    app.get("/api/db/:key/:element_id", view_get_key_element);
    app.post("/api/db/:key", view_new_key_element);
    app.post("/api/db/:key/:element_id", view_update_key_element);
    app.delete("/api/db/:key/:element_id", view_delete_key_element);
}

function initialize(app_config, user_module) {
    USER = user_module;
    config = app_config;

    // Read the user database
    try {
        let data = fs.readFileSync(config.db);
        try {
            db = JSON.parse(data);
        }
        catch (e) {
            throw new Error("Failed to parse db file: " + config.db);
        }
    }
    catch (e) {
        let id;
        tools.log("DB", `Failed to open ${ config.db } as db: ${e.message}`);
        tools.log("DB", "*****************************************************")
        tools.log("DB", `Creating empty db.`);
        db = {};
    }

    migrate_db();
    generate_reverse_references();

    setInterval(() => {
        tools.log("DBSave", "Saving db...");
        fs.writeFile(config.db, JSON.stringify(db), (err) => {
            if(err)
                tools.log("DBSave", `Failed to write db file to ${ config.db }: ${err}`);
            else
                tools.log("DBSave", `DB saved.`)
        })
    }, config.timers.write_db * 1000);
}

module.exports = {
    initialize: initialize,
    setup_routes: setup_routes,
  
    db: () => {return db},
};