function show_edit_form(data) {
    DOM.add_form({
        title: `Edit ${data.name}`,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            description: {type: "multistring", label: "Description", value: data.description},
        }
    }, (form_result, update_form) => {
        REQUESTS.post(`/api/db/region/${data.id}`, {fields: {
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
                DOM.message("Region Updated", `Region ${data.name} updated`);
            }
        })
    })
}

function show_delete_form(data) {
    DOM.add_form({
        title: `Delete ${data["name"]}?`,
        submit_label: "Delete",
        fields: {}
    }, (form_result, update_form) => {
        REQUESTS.delete(`/api/db/region/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Region deleted", `Region ${data["name"]} deleted.`);
            }
        })
    })
}

function load_datatable() {
    REQUESTS.get("/api/db/region", (err, result) => {
        if(err) {
            DOM.message("Error in Region", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting Location Categories", result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.name, name: "name"},
                {type: "text", text: result[id].fields.description, name: "description"},
                {type: "actions", actions: [
                    {label: "???????", description: "Edit", action: show_edit_form},
                    {label: "??????", description: "Delete", action: show_delete_form},
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: "List of Location Categories",
            head: ["Name", "Description", "Actions"],
            body: table_data,
            filters: [ "name", "description"],
        }

        //DOM.add_table_data(DOM.get_id("usertable_body"), table_data);
        DOM.add_table(DOM.get_id("locationtable"), table);
    });
}

function main() {
    DOM.get_id("menu_region").style.fontWeight = "bold";

    load_datatable();

    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New Region");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: "New Region",
            submit_label: "Create",
            fields: {
                name: {type: "string", label: "Name", value: ""},
                description: {type: "multistring", label: "Description", value: ""},
            }
        }, (form_result, update_form) => {
            REQUESTS.post("/api/db/region", {
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
                    DOM.message("New Region", "New region created successfully.");
                }
            })
        })
    })
}