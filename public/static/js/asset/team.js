function show_edit_form(data, read_only = false) {
    DOM.add_form({
        title: `Edit ${data.name}`,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            description: {type: "multistring", label: "Description", value: data.description},
            email: {type: "string", label: "Email", value: data.email},
            links: {type: "links", label: "Links", value: data.links},
        }
    }, (form_result, update_form) => {
        REQUESTS.post(`/api/db/team/${data.id}`, {fields: {
            name: form_result.name,
            description: form_result.description,
            email: form_result.email,
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
                DOM.message("Team Updated", `Team ${data.name} updated`);
            }
        })
    }, read_only)
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

function show_view_form(data) {
    show_edit_form(data, true);
}

function show_docs_form(data) {
    let docs_form = add_docs_management("team", data.id, "documents", data.documents, () => {
        DOM.destroy(docs_form);
        load_datatable();
        show_docs_form(data);
    });
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
                {type: "linklist", name: "links", list: result[id].fields.links},
                {type: "doclist", name: "documents", docs: result[id].fields.documents, baseurl: `/api/db/team/${id}/download/documents`},
                {type: "actions", actions: [
                    {label: "🔍", description: "View", action: show_view_form },
                    {label: "🖋️", description: "Edit", action: show_edit_form},
                    {label: "📄", description: "Manage Docs", action: show_docs_form },
                    {label: "☠️", description: "Delete", action: show_delete_form},
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: "List of Teams",
            head: ["Name", "Description", "Email", "Links", "Docs", "Actions"],
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
                description: {type: "multistring", label: "Description", value: ""},
                email: {type: "string", label: "Email", value: ""},
                links: {type: "links", label: "Links", value: []},
            }
        }, (form_result, update_form) => {
            REQUESTS.post("/api/db/team", {
                name: form_result.name,
                description: form_result.description,
                email: form_result.email,
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
                    DOM.message("New Team", "New team created successfully.");
                }
            })
        })
    })
}