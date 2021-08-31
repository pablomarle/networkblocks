const fs = require("fs");
const fileUpload = require('express-fileupload');
const model_definition = require("./model_definition");
const tools = require("./tools")
const validator = require("./validator")
const IP = require("./ip")

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

    // Create elements root if they don't exist
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
                    element.fields[field] = "";
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
                    if(db.keys[key][element_id].fields[field_name] !== "") {
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
        if((value === "") && (!field_model.null)) {
            return `Field '${field_name}' can't be null.`;
        }
        else if((value !== "") && (!(value in db.keys[referenced_key])) ) {
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
    else if(field_model.type === "ip") {
        let ip = IP.address.create(value);
        if(ip === null)
            return `Field '${field_name}' value invalid.`;

        // Check if object needs to be unique
        if(field_model.unique) {
            let ip_string = IP.address.toLongString(ip);
            for(let other_element_id in db.keys[key]) {
                if((element_id !== other_element_id) && (db.keys[key][other_element_id].fields[field_name] === ip_string))
                    return `Field '${field_name}' duplicated.`;
            }
        }
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

        if(["ip", "string", "name", "text", "email", "number", "mac_address"].indexOf(field_model.type) !== -1) {
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

            if(field_model.type === "ip") {
                // For ips, we store the long representation only (in case ipv6 has :: )
                fields[field_name] = IP.address.toLongString(IP.address.create(fields[field_name]));
            }
        }
        else if(field_model.type === "reference") {
            if(field_name in req.body) {
                fields[field_name] = req.body[field_name];
            }
            else if("default" in field_model) {
                fields[field_name] = field_model.default;
            }
            else
                fields[field_name] = "";

            // Validate field
            let validate_result = validate_element_field(key, null, field_name, fields[field_name]);
            if(validate_result)
                return res.status(400).json({error: validate_result});

            if(fields[field_name] != "") {
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
            fields[field_name] = {};
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

    // Check and apply post processing
    if(model.post_processing) {
        for(let post_processor of model.post_processing) {
            post_processor(db, new_id, create_reverse_reference, remove_reverse_reference);
        }
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

    // Check if this is a valid api call.
    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

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
            else if(field_model.type === "ip") {
                // For ips, we store the long representation only (in case ipv6 has :: )
                element.fields[field_name] = IP.address.toLongString(IP.address.create(req.body.fields[field_name]));
            }
            else if(field_model.type === "reference") {
                if(element.fields[field_name] !== "")
                    remove_reverse_reference(key, element_id, field_name, field_model.referenced_key, element.fields[field_name]);

                element.fields[field_name] = req.body.fields[field_name];
                    
                if(req.body.fields[field_name] !== "")
                    create_reverse_reference(key, element_id, field_name, field_model.referenced_key, element.fields[field_name]);
            }
            else if(field_model.type === "links") {
                element.fields[field_name] = [];

                for(let link_entry of req.body.fields[field_name]) {
                    element.fields[field_name].push({name: link_entry.name, url: link_entry.url});
                }
            }
        }

        // Check and apply post processing
        if(model.post_processing) {
            for(let post_processor of model.post_processing) {
                post_processor(db, element_id, create_reverse_reference, remove_reverse_reference);
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
        if((model.fields[field_name].type === "reference") && (db.keys[key][element_id].fields[field_name] !== "")) {
            remove_reverse_reference(key, element_id, field_name, 
                model.fields[field_name].referenced_key, db.keys[key][element_id].fields[field_name]);
        }
    }

    // Remove the element
    tools.log("view_delete_key_element", `User '${user}' removed element '${key}' '${element_id}'.`)
    delete db.keys[key][element_id];
    return res.status(200).json({});
}

function view_upload_document(req, res) {
    // Check if key exists
    if(!(req.params.key in model_definition.keys))
        return res.status(404).json({"error": "Not found"});

    let key = req.params.key;
    let element_id = req.params.element_id
    let model = model_definition.keys[key];
    let field_name = req.params.field_name;

    // Check if user is allowed
    let user = USER.is_user_allowed(req, model.permissions.rw);
    if(!user)
        return res.status(403).json({error: "You are not authorized."});

    // Check if element_id exists
    if(!(element_id in db.keys[key])) {
        return res.status(404).json({"error": "Not found"});
    }

    // Check if field is of type document
    if((!model.fields.hasOwnProperty(field_name)) || (model.fields[field_name].type !== "documents"))
        return res.status(400).json({"error": "Invalid field"});

    // Check if file parameters are valid
    if(!req.hasOwnProperty("files"))
        return res.status(400).json({"error": "No files uploaded"});

    if(!req.files.hasOwnProperty("upload"))
        return res.status(400).json({"error": "No files uploaded"});

    if(req.files.upload.truncated)
        return res.status(400).json({"error": `Uploaded file too big (max=${config.limits.file_size}MB)`});

    if(!req.body.hasOwnProperty("title"))
        return res.status(400).json({"error": "No title added"});

    if(!validator.validate_name(req.body.title))
        return res.status(400).json({"error": "Title is invalid"});

    if(!req.body.hasOwnProperty("description"))
        return res.status(400).json({"error": "No description added"});

    if(!validator.validate_description(req.body.description))
        return res.status(400).json({"error": "Description is invalid"});

    // Create the document
    let new_id = tools.generate_id(db.keys[key][element_id].fields[field_name]);
    let new_version_id = new_id + "_0";
    let timestamp = Date.now();
    let doc_metadata = {
        title: req.body.title,
        description: req.body.description,
        versions: [{
            created_by: user, 
            created: timestamp,
            filename: req.files.upload.name,
        }],
        created_by: user,
        created: timestamp,
        last_modified_by: user,
        last_modified: timestamp,
    }
    let path = `${config.documents}/${key}/${element_id}/${field_name}/${new_version_id}`;
    req.files.upload.mv(path, (err) => {
        if(err) {
            tools.log("view_upload_document", `Error copying file ${key} ${element_id} ${field_name}: ${err}`);
            return res.status(500).json({"error": "Error saving file."});
        }

        // Fix documnet field if it's an array
        if(Array.isArray(db.keys[key][element_id].fields[field_name]))
            db.keys[key][element_id].fields[field_name] = {};

        // Add metadata and respond
        db.keys[key][element_id].fields[field_name][new_id] = doc_metadata;
        tools.log("view_upload_document", `User ${user} uploaded document ${new_id} to ${key} ${element_id} ${field_name}`);
        res.status(200).json({id: new_id, data: db.keys[key][element_id].fields[field_name][new_id]});
    });
}

function view_update_document(req, res) {
    // Check if key exists
    if(!(req.params.key in model_definition.keys))
        return res.status(404).json({"error": "Not found"});

    let key = req.params.key;
    let element_id = req.params.element_id
    let model = model_definition.keys[key];
    let field_name = req.params.field_name;
    let document_id = req.params.document_id;

    // Check if user is allowed
    let user = USER.is_user_allowed(req, model.permissions.rw);
    if(!user)
        return res.status(403).json({error: "You are not authorized."});

    // Check if this is a valid api call.
    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    // Check if element_id exists
    if(!(element_id in db.keys[key])) {
        return res.status(404).json({"error": "Not found"});
    }

    // Check if field is of type document
    if((!model.fields.hasOwnProperty(field_name)) || (model.fields[field_name].type !== "documents"))
        return res.status(400).json({"error": "Invalid field"});

    // Check if document exists
    if(!db.keys[key][element_id].fields[field_name].hasOwnProperty(document_id)) {
        return res.status(400).json({"error": "Invalid document"});
    }

    // Verify if title and description are valid
    if(!validator.validate_name(req.body.title)) {
        return res.status(400).json({"error": "Invalid title"});
    }
    if(!validator.validate_description(req.body.description)) {
        return res.status(400).json({"error": "Invalid description"});
    }

    db.keys[key][element_id].fields[field_name][document_id].title = req.body.title;
    db.keys[key][element_id].fields[field_name][document_id].description = req.body.description;
    db.keys[key][element_id].fields[field_name][document_id].last_modified_by = user;
    db.keys[key][element_id].fields[field_name][document_id].last_modified = Date.now();

    tools.log("view_update_document", `User ${user} updated document ${document_id} on ${key} ${element_id} ${field_name}`);
    res.status(200).json(db.keys[key][element_id].fields[field_name][document_id]);
}

function view_version_document(req, res) {
    // Check if key exists
    if(!(req.params.key in model_definition.keys))
        return res.status(404).json({"error": "Not found"});

    let key = req.params.key;
    let element_id = req.params.element_id
    let model = model_definition.keys[key];
    let field_name = req.params.field_name;
    let document_id = req.params.document_id;

    // Check if user is allowed
    let user = USER.is_user_allowed(req, model.permissions.rw);
    if(!user)
        return res.status(403).json({error: "You are not authorized."});

    // Check if element_id exists
    if(!(element_id in db.keys[key])) {
        return res.status(404).json({"error": "Not found"});
    }

    // Check if field is of type document
    if((!model.fields.hasOwnProperty(field_name)) || (model.fields[field_name].type !== "documents"))
        return res.status(400).json({"error": "Invalid field"});

    // Check if document exists
    if(!db.keys[key][element_id].fields[field_name].hasOwnProperty(document_id)) {
        return res.status(400).json({"error": "Invalid document"});
    }

    // Check if file parameters are valid
    if(!req.hasOwnProperty("files"))
        return res.status(400).json({"error": "No files uploaded"});

    if(!req.files.hasOwnProperty("upload"))
        return res.status(400).json({"error": "No files uploaded"});

    if(req.files.upload.truncated)
        return res.status(400).json({"error": `Uploaded file too big (max=${config.limits.file_size}MB)`});

    let timestamp = Date.now();
    let version_metadata = {
        created_by: user, 
        created: timestamp,
        last_updated_by: user, 
        last_updated: timestamp,
        filename: req.files.upload.name,
    }
    let version_index = db.keys[key][element_id].fields[field_name][document_id].versions.length;
    let new_version_id = `${document_id}_${version_index}`

    let path = `${config.documents}/${key}/${element_id}/${field_name}/${new_version_id}`;
    req.files.upload.mv(path, (err) => {
        if(err) {
            tools.log("view_version_document", `Error copying file ${key} ${element_id} ${field_name}: ${err}`);
            return res.status(500).json({"error": "Error saving file."});
        }

        // Add metadata and respond
        db.keys[key][element_id].fields[field_name][document_id].versions.push(version_metadata);
        tools.log("view_version_document", `User ${user} uploaded new version to document ${document_id} to ${key} ${element_id} ${field_name}`);
        res.status(200).json({id: new_version_id, data: db.keys[key][element_id].fields[field_name][document_id].versions[version_index]});
    });
}

function view_delete_document(req, res) {
    // Check if key exists
    if(!(req.params.key in model_definition.keys))
        return res.status(404).json({"error": "Not found"});

    let key = req.params.key;
    let element_id = req.params.element_id
    let model = model_definition.keys[key];
    let field_name = req.params.field_name;
    let document_id = req.params.document_id;

    // Check if user is allowed
    let user = USER.is_user_allowed(req, model.permissions.rw);
    if(!user)
        return res.status(403).json({error: "You are not authorized."});

    // Check if this is a valid api call.
    if(!validator.validate_api_call(req))
        return res.status(400).json({error: "Invalid API call."})

    // Check if element_id exists
    if(!(element_id in db.keys[key])) {
        return res.status(404).json({"error": "Not found"});
    }

    // Check if field is of type document
    if((!model.fields.hasOwnProperty(field_name)) || (model.fields[field_name].type !== "documents"))
        return res.status(400).json({"error": "Invalid field"});

    // Check if document exists
    if(!db.keys[key][element_id].fields[field_name].hasOwnProperty(document_id)) {
        return res.status(400).json({"error": "Invalid document"});
    }

    delete db.keys[key][element_id].fields[field_name][document_id]

    tools.log("view_delete_document", `User ${user} deleted document ${document_id} on ${key} ${element_id} ${field_name}`);
    res.status(200).json({});
}

function view_get_document(req, res) {
    // Check if key exists
    if(!(req.params.key in model_definition.keys))
        return res.status(404).json({"error": "Not found"});

    let key = req.params.key;
    let element_id = req.params.element_id
    let model = model_definition.keys[key];
    let field_name = req.params.field_name;
    let document_id = req.params.document_id;

    // Check if user is allowed
    let user = USER.is_user_allowed(req, model.permissions.ro);
    if(!user)
        return res.status(403).json({error: "You are not authorized."});

    // Check if element_id exists
    if(!(element_id in db.keys[key])) {
        return res.status(404).json({"error": "Not found"});
    }

    // Check if field is of type document
    if((!model.fields.hasOwnProperty(field_name)) || (model.fields[field_name].type !== "documents"))
        return res.status(400).json({"error": "Invalid field"});

    // Check if document exists
    if(!db.keys[key][element_id].fields[field_name].hasOwnProperty(document_id)) {
        return res.status(400).json({"error": "Invalid document"});
    }

    // Get the right version
    let version_index = req.params.version_index;
    if(!version_index) {
        version_index = db.keys[key][element_id].fields[field_name][document_id].versions.length - 1;
    }
    else {
        if(isNaN(version_index)) {
            return res.status(400).json({"error": "Invalid version"});
        }
        version_index = parseInt(version_index);
    }

    let new_version_id = `${document_id}_${version_index}`;
    let path = `${config.documents}/${key}/${element_id}/${field_name}/${new_version_id}`;
    
    res.download(path, db.keys[key][element_id].fields[field_name][document_id].versions[version_index].filename);
}

function setup_routes(app) {
    app.get("/api/db/:key", view_get_key_list);
    app.get("/api/db/:key/:element_id", view_get_key_element);
    app.post("/api/db/:key", view_new_key_element);
    app.post("/api/db/:key/:element_id", view_update_key_element);
    app.delete("/api/db/:key/:element_id", view_delete_key_element);

    let fileUploadHandler = fileUpload({
        limits: {fileSize: 1024 * 1024 * config.limits.file_size,},
        createParentPath: true,
    });
    
    // New document upload
    app.post("/api/db/:key/:element_id/upload/:field_name", fileUploadHandler, view_upload_document);

    // Existing document upload new version or update title description
    app.post("/api/db/:key/:element_id/upload/:field_name/:document_id/version", fileUploadHandler, view_version_document);
    app.post("/api/db/:key/:element_id/upload/:field_name/:document_id", view_update_document);

    // Delete document
    app.delete("/api/db/:key/:element_id/upload/:field_name/:document_id", view_delete_document);

    // Get document
    app.get("/api/db/:key/:element_id/download/:field_name/:document_id", view_get_document);
    app.get("/api/db/:key/:element_id/download/:field_name/:document_id/:version_index", view_get_document);
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