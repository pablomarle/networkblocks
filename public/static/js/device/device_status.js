let options = {
    // rack: {field: "name", data: null, null_allowed: true },
}

function show_edit_form(data, read_only = false) {
    let title = `Edit ${data.name}`;
    if(read_only)
        title = data.name;

    DOM.add_form({
        title: title,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            description: {type: "multistring", label: "Description", value: data.description},
        }
    }, (form_result, update_form) => {
        REQUESTS.post(`/api/db/device_status/${data.id}`, {fields: {
            name: form_result.name,
            description: form_result.description,
        }}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Status Updated", `Status ${post_result.fields.name} updated`);
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
        REQUESTS.delete(`/api/db/device_status/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Status deleted", `Status ${data.name} deleted.`);
            }
        })
    })
}

function show_view_form(data) {
    show_edit_form(data, true);
}

function load_datatable() {
    REQUESTS.get("/api/db/device_status", (err, result) => {
        if(err) {
            DOM.message("Error getting Device Status List", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting Device Status List", result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.name, name: "name"},
                {type: "text", text: result[id].fields.description, name: "description"},
                {type: "actions", actions: [
                    {label: "🔍", description: "View", action: show_view_form },
                    {label: "🖋️", description: "Edit", action: show_edit_form },
                    {label: "☠️", description: "Delete", action: show_delete_form },
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: "List of Device Status",
            head: ["Name", "Description", "Actions"],
            body: table_data,
            filters: [ "name", "description"],
        }

        DOM.add_table(DOM.get_id("datatable"), table);
    });
}

function main() {
    DOM.get_id("menu_status").style.fontWeight = "bold";

    load_options(options, load_datatable);

    let new_button = DOM.get_id("new_element");
    DOM.add_text(new_button, "New Status");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: `New Status`,
            submit_label: "Create",
            fields: {
                name: {type: "string", label: "Name", value: ""},
                description: {type: "multistring", label: "Description", value: ""},
            }
        }, (form_result, update_form) => {
            REQUESTS.post("/api/db/device_status", {
                name: form_result.name,
                description: form_result.description,
            }, (err, post_result) => {
                if(err) {
                    update_form(err);
                }
                else if("error" in post_result)
                    update_form(post_result.error)
                else {
                    update_form();
                    load_datatable();
                    DOM.message("New Status", "New device status created successfully.");
                }
            })
        })
    })
}