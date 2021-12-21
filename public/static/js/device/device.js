let URL_KEY = "device";
let ELEMENT_NAME = "Device";
let options = {
    os_version: {field: "version", data: null, null_allowed: false },
    os: {field: "name", data: null, null_allowed: false },
    environment: {field: "name", data: null, null_allowed: false },
    device_function: {field: "name", data: null, null_allowed: false },
    team: {field: "name", data: null, null_allowed: false },
    device_status: {field: "name", data: null, null_allowed: false },
    asset: {field: "serial_number", data: null, null_allowed: false },
}
let osversion_options = {};

function show_edit_form(data, read_only = false) {
    let title = `Edit ${data.name}`;
    if(read_only)
        title = data.name;

    DOM.add_form({
        title: title,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            mgmt_ip: {type: "string", label: "MGMT IP", value: data.mgmt_ip},
            environment: {type: "select", label: "Environment", options: options.environment.data, value: data.environment},
            function: {type: "select", label: "Function", options: options.device_function.data, value: data.function},
            owner: {type: "select", label: "Owner", options: options.team.data, value: data.owner},
            status: {type: "select", label: "Status", options: options.device_status.data, value: data.status},
            os_version: {type: "select", label: "OS Version", options: osversion_options, value: data.os_version},
            links: {type: "links", label: "Links", value: data.links},
        }
    }, (form_result, update_form) => {
        REQUESTS.post(`/api/db/${URL_KEY}/${data.id}`, {fields: {
            name: form_result.name,
            mgmt_ip: form_result.mgmt_ip,
            environment: form_result.environment,
            function: form_result.function,
            owner: form_result.owner,
            status: form_result.status,
            os_version: form_result.os_version,
            links: form_result.links,
        }}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message(`${ELEMENT_NAME} Updated`, `${ELEMENT_NAME} ${post_result.fields.name} updated`);
            }
        })
    }, read_only);
}

function show_delete_form(data) {
    DOM.add_form({
        title: `Delete ${data.name}?`,
        submit_label: "Delete",
        fields: {}
    }, (form_result, update_form) => {
        REQUESTS.delete(`/api/db/${URL_KEY}/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message(`${ELEMENT_NAME} deleted`, `${ELEMENT_NAME} ${data.name} deleted.`);
            }
        })
    })
}

function show_view_form(data) {
    let title = data.name;

    let asset_list = [];
    for(let asset_id in options.asset.full_data) {
        if(options.asset.full_data[asset_id].fields.device === data.id) {
            asset_list.push(options.asset.data[asset_id]);
        }
    };
    DOM.add_form({
        title: title,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            mgmt_ip: {type: "string", label: "MGMT IP", value: data.mgmt_ip},
            environment: {type: "select", label: "Environment", options: options.environment.data, value: data.environment},
            function: {type: "select", label: "Function", options: options.device_function.data, value: data.function},
            owner: {type: "select", label: "Owner", options: options.team.data, value: data.owner},
            status: {type: "select", label: "Status", options: options.device_status.data, value: data.status},
            os_version: {type: "select", label: "OS Version", options: osversion_options, value: data.os_version},
            assets: {type: "string", label: "Assets", value: asset_list},
            links: {type: "links", label: "Links", value: data.links},
        }
    }, null, true);
}

function show_docs_form(data) {
    let docs_form = add_docs_management(URL_KEY, data.id, "documents", data.documents, () => {
        DOM.destroy(docs_form);
        load_datatable();
        show_docs_form(data);
    });
}

function load_datatable() {
    REQUESTS.get(`/api/db/${URL_KEY}`, (err, result) => {
        if(err) {
            DOM.message(`Error getting ${ELEMENT_NAME} List`, err, true);
            return;
        }
        else if("error" in result) {
            DOM.message(`Error getting ${ELEMENT_NAME} List`, result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.name, name: "name"},
                {type: "text", text: result[id].fields.mgmt_ip, name: "mgmt_ip"},
                {type: "text", text: result[id].fields.os_version, name: "os_version", hidden: true},
                {type: "text", text: osversion_options[result[id].fields.os_version], name: "os_version_name"},
                {type: "text", text: result[id].fields.environment, name: "environment", hidden: true},
                {type: "text", text: options.environment.data[result[id].fields.environment], name: "environment_name"},
                {type: "text", text: result[id].fields.function, name: "function", hidden: true},
                {type: "text", text: options.device_function.data[result[id].fields.function], name: "function_name"},
                {type: "text", text: result[id].fields.owner, name: "owner", hidden: true},
                {type: "text", text: options.team.data[result[id].fields.owner], name: "owner_name"},
                {type: "text", text: result[id].fields.status, name: "status", hidden: true},
                {type: "text", text: options.device_status.data[result[id].fields.status], name: "status_name"},
                //{type: "text", text: options.os_version.data[result[id].fields.os_version], name: "os_version_name"},
                {type: "linklist", name: "links", list: result[id].fields.links},
                {type: "actions", actions: [
                    {label: "🔍", description: "View", action: show_view_form },
                    {label: "🖋️", description: "Edit", action: show_edit_form },
                    {label: "☠️", description: "Delete", action: show_delete_form },
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: `List of ${ELEMENT_NAME}s`,
            head: ["Name", "Mgmt IP", "OS", "Environment", "Function", "Owner", "Status", "Links", "Actions"],
            body: table_data,
            filters: [ "name", "mgmt_ip", "osversion_name", "environment_name", "function_name", "owner_name", "status_name"],
        }

        DOM.add_table(DOM.get_id("datatable"), table);
    });
}

function postprocess_options() {
    for(let id in options.os_version.data) {
        osversion_options[id] = `${options.os.data[options.os_version.full_data[id].fields.os]} ${options.os_version.data[id]}`;
    }
    load_datatable();
}
function main() {
    DOM.get_id("menu_device").style.fontWeight = "bold";

    load_options(options, postprocess_options);

    let new_button = DOM.get_id("new_element");
    DOM.add_text(new_button, `New ${ELEMENT_NAME}`);
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: `New ${ELEMENT_NAME}`,
            submit_label: "Create",
            fields: {
                name: {type: "string", label: "Name", value: ""},
                mgmt_ip: {type: "string", label: "MGMT IP", value: ""},
                environment: {type: "select", label: "Environment", options: options.environment.data, value: ""},
                function: {type: "select", label: "Function", options: options.device_function.data, value: ""},
                owner: {type: "select", label: "Owner", options: options.team.data, value: ""},
                status: {type: "select", label: "Status", options: options.device_status.data, value: ""},
                os_version: {type: "select", label: "OS Version", options: osversion_options, value: ""},
                links: {type: "links", label: "Links", value: []},
               }
        }, (form_result, update_form) => {
            REQUESTS.post(`/api/db/${URL_KEY}`, {
                name: form_result.name,
                mgmt_ip: form_result.mgmt_ip,
                environment: form_result.environment,
                function: form_result.function,
                owner: form_result.owner,
                status: form_result.status,
                os_version: form_result.os_version,
                links: form_result.links,
            }, (err, post_result) => {
                if(err) {
                    update_form(err);
                }
                else if("error" in post_result)
                    update_form(post_result.error)
                else {
                    update_form();
                    load_datatable();
                    DOM.message(`New ${ELEMENT_NAME}`, `New ${ELEMENT_NAME} created successfully.`);
                }
            })
        })
    })
}