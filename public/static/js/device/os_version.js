let URL_KEY = "os_version";
let ELEMENT_NAME = "Version";
let options = {
    os: {field: "name", data: null, null_allowed: false },
}

function show_edit_form(data, read_only = false) {
    let title = `Edit ${data.version}`;
    if(read_only)
        title = data.version;

    DOM.add_form({
        title: title,
        submit_label: "Update",
        fields: {
            version: {type: "string", label: "Name", value: data.version},
            description: {type: "multistring", label: "Description", value: data.description},
            os: {type: "select", label: "OS", options: options.os.data, value: data.os},
            links: {type: "links", label: "Links", value: data.links},
        }
    }, (form_result, update_form) => {
        REQUESTS.post(`/api/db/${URL_KEY}/${data.id}`, {fields: {
            version: form_result.version,
            description: form_result.description,
            os: form_result.os,
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
                DOM.message(`${ELEMENT_NAME} Updated`, `${ELEMENT_NAME} ${post_result.fields.version} updated`);
            }
        })
    }, read_only);
}

function show_delete_form(data) {
    DOM.add_form({
        title: `Delete ${data.version}?`,
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
                DOM.message(`${ELEMENT_NAME} deleted`, `${ELEMENT_NAME} ${data.version} deleted.`);
            }
        })
    })
}

function show_view_form(data) {
    show_edit_form(data, true);
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
                {type: "text", text: result[id].fields.os, name: "os", hidden: true},
                {type: "text", text: options.os.data[result[id].fields.os], name: "os_name"},
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.version, name: "version"},
                {type: "text", text: result[id].fields.description, name: "description"},
                {type: "linklist", name: "links", list: result[id].fields.links},
                {type: "doclist", name: "documents", docs: result[id].fields.documents, baseurl: `/api/db/${URL_KEY}/${id}/download/documents`},
                {type: "actions", actions: [
                    {label: "🔍", description: "View", action: show_view_form },
                    {label: "🖋️", description: "Edit", action: show_edit_form },
                    {label: "📄", description: "Manage Docs", action: show_docs_form },
                    {label: "☠️", description: "Delete", action: show_delete_form },
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: `List of ${ELEMENT_NAME}s`,
            head: ["OS", "Version", "Description", "Links", "Docs", "Actions"],
            body: table_data,
            filters: [ "os_name", "version", "description"],
        }

        DOM.add_table(DOM.get_id("datatable"), table);
    });
}

function main() {
    DOM.get_id("menu_os_version").style.fontWeight = "bold";

    load_options(options, load_datatable);

    let new_button = DOM.get_id("new_element");
    DOM.add_text(new_button, `New ${ELEMENT_NAME}`);
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: `New ${ELEMENT_NAME}`,
            submit_label: "Create",
            fields: {
                version: {type: "string", label: "Version", value: ""},
                description: {type: "multistring", label: "Description", value: ""},
                os: {type: "select", label: "OS", options: options.os.data, value: ""},
                links: {type: "links", label: "Links", value: []},
            }
        }, (form_result, update_form) => {
            REQUESTS.post(`/api/db/${URL_KEY}`, {
                version: form_result.version,
                description: form_result.description,
                os: form_result.os,
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