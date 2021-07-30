function show_edit_form(data) {
    DOM.add_form({
        title: `Edit ${data.name}`,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            code: {type: "string", label: "Code", value: data.code},
            relative_value: {type: "string", label: "Relative Value", value: data.relative_value},
        }
    }, (form_result, update_form) => {
        if(isNaN(form_result.relative_value) || (form_result.relative_value <= 0)) {
            update_form("Relative Value should be a positive number");
            return;
        }
        REQUESTS.post(`/api/db/currency/${data.id}`, {fields: {
            name: form_result.name,
            code: form_result.code,
            relative_value: parseFloat(form_result.relative_value),
        }}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Currency", `Currency ${data.name} updated`);
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
        REQUESTS.delete(`/api/db/currency/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Currency deleted", `Currency ${data["name"]} deleted.`);
            }
        })
    })
}

function load_datatable() {
    REQUESTS.get("/api/db/currency", (err, result) => {
        if(err) {
            DOM.message("Error in Currency", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting Currencies", result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.name, name: "name"},
                {type: "text", text: result[id].fields.code, name: "code"},
                {type: "text", text: result[id].fields.relative_value, name: "relative_value"},
                {type: "actions", actions: [
                    {label: "🖋️", description: "Edit", action: show_edit_form},
                    {label: "☠️", description: "Delete", action: show_delete_form},
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: "List of Currencies",
            head: ["Name", "Code", "Relative Value", "Actions"],
            body: table_data,
            filters: [ "name", "description", "relative_value"],
        }

        DOM.add_table(DOM.get_id("locationtable"), table);
    });
}

function main() {
    DOM.get_id("menu_currency").style.fontWeight = "bold";

    load_datatable();

    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New Currency");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: "New Currency",
            submit_label: "Create",
            fields: {
                name: {type: "string", label: "Name", value: ""},
                code: {type: "string", label: "Code", value: ""},
                relative_value: {type: "string", label: "Relative Value", value: "1"},
            }
        }, (form_result, update_form) => {
            if(isNaN(form_result.relative_value) || (form_result.relative_value <= 0)) {
                update_form("Relative Value should be a positive number");
                return;
            }
            REQUESTS.post("/api/db/currency", {
                name: form_result.name,
                code: form_result.code,
                relative_value: parseFloat(form_result.relative_value),
            }, (err, post_result) => {
                if(err) {
                    update_form(err);
                }
                else if("error" in post_result)
                    update_form(post_result.error)
                else {
                    update_form();
                    load_datatable();
                    DOM.message("New Currency", "New currency created successfully.");
                }
            })
        })
    })
}