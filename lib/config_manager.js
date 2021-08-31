const fs = require("fs");

const DEFAULTS = {
    cookie_secret: "not_so_secret_please_change_on_config_file",
    session_cookie: "nm_session",
    session_duration: 24*3600,
    socket: {
        port: 3000,
    },
    userdb: "data/user.json",
    db: "data/db.json",
    documents: "data/documents/",
    timers: {
        write_userdb: 300,
        write_db: 300,
        session_cleanup: 3600*24,
    },
    initial_admin_email: "admin@networkmaps.org",
    server_url: "undefined by admin",
    smtp: {
        from: "admin@networkmaps.org",
        only_log: true,
        server: "",
        port: 0,
        is_secured: false,
        verify_ssl_cert: false,
        user: "",
        password: "",
    },
    limits: {
        file_size: 5,    // Max upload file size
    }
}

function copy_no_override(destination, source) {
    // For each key in the source, check if that key exists in the destination
    // If it doesn't, we copy it.
    for(let key in source) {
        if(key in destination) {
            // If the key exists on the destination, we will not override the value but,
            // if both values are objects, we will run the copy no override process on the
            // values.
            if( (typeof source[key] === "object") && (typeof destination[key] === "object") ) {
                copy_no_override(destination[key], source[key]);
            }
        }
        else {
            // If the key does not exists in the destination, we will copy it.
            // If the types are string, boolean or number, we copy them directly. In case of objects,
            // we don't want to copy the reference. So, we create an empty object on the
            // destination and run the copy dunction on it.
            if( (typeof source[key] === "number") || (typeof source[key] === "string") || (typeof source[key] === "boolean") ) {
                destination[key] = source[key];
            }
            else if (typeof source[key] === "object") {
                destination[key] = {};
                copy_no_override(destination[key], source[key]);
            }
            else
                throw new Error(`Element ${key} of object not a valid type (not number, string, boolean or object)`);
        }
    }
}

function load_config(path) {
    let data, json;

    try {
        data = fs.readFileSync(path);
    }
    catch (e) {
        console.error("Failed to open configuration file: " + path)
        console.error(e.message);
        return null;
    }

    try {
        json = JSON.parse(data);
    }
    catch (e) {
        console.error("Failed to parse configuration file. Make sure it is valid JSON.")
        console.error(e.message);
        return null;  
    }

    try {
        copy_no_override(json, DEFAULTS);
    }
    catch (e) {
        console.error("Failed to parse configuration file.")
        console.error(e.message);
        return null;  
    }

    console.log("Config file parsed.")

    return json;
}

module.exports = {
    load_config: load_config,
    copy_no_override: copy_no_override,
}