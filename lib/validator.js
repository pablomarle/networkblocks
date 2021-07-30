const EMAIL_REGEX = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})/
const STRING_REGEX = /^[ \p{L}\p{N}*\-_$.,\+\(\)]*$/u
const NAME_REGEX = /^[ \p{L}\p{N}*\-_$.,]+$/u
const DESCRIPTION_REGEX = /^[ \p{L}\p{N}\p{P}\n*\-_$.,\+\(\)]*$/u
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/

function validate_url(e) {
    if(typeof e !== "string")
        return false;

    try {
        let url = new URL(e);
    } catch {
        return false;
    }

    return true;
}

function validate_string_like(regex, min_length, max_length, e) {
    if(typeof e !== "string")
        return false;

    if((e.length > max_length) || (e.length < min_length))
        return false;

    return regex.test(e);
}

function validate_mac_address(e) {
    return validate_string_like(MAC_ADDRESS_REGEX, 17, 17, e);
}

function validate_email(e) {
    return validate_string_like(EMAIL_REGEX, 1, 128, e);
}

function validate_string(e) {
    return validate_string_like(STRING_REGEX, 0, 64, e);
}

function validate_name(e) {
    return validate_string_like(NAME_REGEX, 1, 64, e);
}

function validate_description(e) {
    return validate_string_like(DESCRIPTION_REGEX, 0, 1024, e);
}

function validate_password(e) {
    return validate_string_like(PWD_REGEX, 1, 32, e);
}

function validate_api_call(req) {
    if(!req.is('application/json'))
        return false;

    if(typeof req.body !== "object")
        return false;

    return true;
}

module.exports = {
    validate_url: validate_url,
    validate_mac_address: validate_mac_address,
    validate_email: validate_email,
    validate_string: validate_string,
    validate_name: validate_name,
    validate_password: validate_password,
    validate_description: validate_description,
    validate_api_call: validate_api_call,
}