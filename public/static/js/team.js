function show_edit_form(data) {
    DOM.add_form({
        title: `Edit ${data.name}`,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            description: {type: "string", label: "Description", value: data.description},
            email: {type: "string", label: "Email", value: data.email},
        }
    }, (form_result, update_form) => {
        REQUESTS.post(`/api/db/team/${data.id}`, {fields: {
            name: form_result.name,
            description: form_result.description,
            email: form_result.email,
        }}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Team Updated", `Team ${data.name} updated`);
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
        REQUESTS.delete(`/api/db/team/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Team deleted", `Team ${data["name"]} deleted.`);
            }
        })
    })
}

function load_datatable() {
    REQUESTS.get("/api/db/team", (err, result) => {
        if(err) {
            DOM.message("Error in Team", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting Teams", result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.name, name: "name"},
                {type: "text", text: result[id].fields.description, name: "description"},
                {type: "text", text: result[id].fields.email, name: "email"},
                {type: "actions", actions: [
                    {label: "🖋️", description: "Edit", action: show_edit_form},
                    {label: "☠️", description: "Delete", action: show_delete_form},
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: "List of Teams",
            head: ["Name", "Description", "Email", "Actions"],
            body: table_data,
            filters: [ "name", "description", "email"],
        }

        DOM.add_table(DOM.get_id("locationtable"), table);
    });
}

function main() {
    DOM.get_id("menu_team").style.fontWeight = "bold";

    load_datatable();

    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New Team");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: "New Team",
            submit_label: "Create",
            fields: {
                name: {type: "string", label: "Name", value: ""},
                description: {type: "string", label: "Description", value: ""},
                email: {type: "string", label: "Team", value: ""},
            }
        }, (form_result, update_form) => {
            REQUESTS.post("/api/db/team", {
                name: form_result.name,
                description: form_result.description,
                email: form_result.email,
            }, (err, post_result) => {
                if(err) {
                    update_form(err);
                }
                else if("error" in post_result)
                    update_form(post_result.error)
                else {
                    update_form();
                    load_datatable();
                    DOM.message("New Team", "New team created successfully.");
                }
            })
        })
    })
}