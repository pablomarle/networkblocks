const crypto = require("crypto");

const ID_LENGTH = 16

function generate_id(dict) {
    let new_id = crypto.randomBytes(ID_LENGTH).toString("hex");
    if(dict) {
        while(new_id in dict)
            new_id = crypto.randomBytes(ID_LENGTH).toString("hex");
    }

    return new_id;
}

function current_date() {
    let date = new Date();
    let day = ("0" + date.getDate()).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let hours = ("0" + date.getHours()).slice(-2);
    let minutes = ("0" + date.getMinutes()).slice(-2);
    let seconds = ("0" + date.getSeconds()).slice(-2);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function log(entity, message) {
    console.log(`${current_date()} ${entity} ${message}`)
}

function deep_copy_json(element) {
    let result, value, key
    
    if (typeof element !== "object" || element === null) {
        return element;
    }
    
    result = Array.isArray(element) ? [] : {}
    
    for (key in element) {
        value = element[key];
    
        result[key] = deep_copy_json(value);
    }
    
    return result;
}

module.exports = {
    generate_id: generate_id,
    log: log,
    deep_copy_json: deep_copy_json,
}