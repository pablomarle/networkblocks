const EMAIL_REGEX = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})/
const NAME_REGEX = /^[ \p{L}\p{N}*-]+$/u
const DESCRIPTION_REGEX = /^[ \p{L}\p{N}\p{P}\n*-]+$/u
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

function validate_email(e) {
    if(typeof e !== "string")
        return false;

    if(e.length > 128)
        return false;

    return EMAIL_REGEX.test(e);
}

function validate_name(e) {
    if(typeof e !== "string")
        return false;

    if(e.length > 64)
        return false;

    return NAME_REGEX.test(e);
}

function validate_description(e) {
    console.log(e)
    if(typeof e !== "string")
        return false;

    if(e.length > 1024)
        return false;

    return DESCRIPTION_REGEX.test(e);
}

function validate_password(e) {
    if(typeof e !== "string")
        return false;

    if(e.length > 32)
        return false;

    return PWD_REGEX.test(e);
}

function validate_api_call(req) {
    if(!req.is('application/json'))
        return false;

    if(typeof req.body !== "object")
        return false;

    return true;
}

module.exports = {
    validate_email: validate_email,
    validate_name: validate_name,
    validate_password: validate_password,
    validate_description: validate_description,
    validate_api_call: validate_api_call,
}