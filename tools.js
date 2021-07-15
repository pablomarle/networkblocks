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

module.exports = {
    generate_id: generate_id,
}