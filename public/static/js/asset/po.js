options = {
    team: {field: "name", data: null, null_allowed: false },
    purchase_order_status: {field: "name", data: null, null_allowed: false },
}

function show_edit_form(data, read_only = false) {
    let title = `Edit ${data.name}`;
    if(read_only)
        title = data.name;

    DOM.add_form({
        title: title,
        submit_label: "Update",
        fields: {
            code: {type: "string", label: "Code", value: data.code},
            description: {type: "multistring", label: "Description", value: data.description},
            status: {type: "select", label: "Status", options: options.purchase_order_status.data, value: data.status},
            team: {type: "select", label: "Team", options: options.team.data, value: data.team},
            links: {type: "links", label: "Links", value: data.links},
        }
}, (form_result, update_form) => {
        REQUESTS.post(`/api/db/purchase_order/${data.id}`, {fields: {
            code: form_result.code,
            description: form_result.description,
            status: form_result.status,
            team: form_result.team,
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
                DOM.message("PO Updated", `PO ${data.code} updated`);
            }
        })
    }, read_only);
}

function show_delete_form(data) {
    DOM.add_form({
        title: `Delete ${data["name"]}?`,
        submit_label: "Delete",
        fields: {}
    }, (form_result, update_form) => {
        REQUESTS.delete(`/api/db/purchase_order/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("PO deleted", `PO ${data["code"]} deleted.`);
            }
        })
    })
}

function show_view_form(data) {
    show_edit_form(data, true);
}

function show_docs_form(data) {
    let docs_form = add_docs_management("purchase_order", data.id, "documents", data.documents, () => {
        DOM.destroy(docs_form);
        load_datatable();
        show_docs_form(data);
    });
}

function load_datatable() {
    REQUESTS.get("/api/db/purchase_order", (err, result) => {
        if(err) {
            DOM.message("Error getting POs", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting POs", result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.code, name: "code"},
                {type: "text", text: result[id].fields.description, name: "description"},
                {type: "text", text: result[id].fields.status, name: "status", hidden: true},
                {type: "text", text: options.purchase_order_status.data[result[id].fields.status], name: "status_name", hidden: false},
                {type: "text", text: result[id].fields.team, name: "team", hidden: true},
                {type: "text", text: options.team.data[result[id].fields.team], name: "team_name"},
                {type: "linklist", name: "links", list: result[id].fields.links},
                {type: "doclist", name: "documents", docs: result[id].fields.documents, baseurl: `/api/db/purchase_order/${id}/download/documents`},
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
            caption: "List of POs",
            head: ["Code", "Description", "Status", "Team", "Links", "Docs", "Actions"],
            body: table_data,
            filters: [ "code", "description", "status_name", "team_name"],
        }

        //DOM.add_table_data(DOM.get_id("usertable_body"), table_data);
        DOM.add_table(DOM.get_id("locationtable"), table);
    });
}

function main() {
    DOM.get_id("menu_po").style.fontWeight = "bold";

    load_options(options, load_datatable);

    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New PO");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: "New PO",
            submit_label: "Create",
            fields: {
                code: {type: "string", label: "Code", value: ""},
                description: {type: "multistring", label: "Description", value: ""},
                status: {type: "select", label: "Status", options: options.purchase_order_status.data, value: ""},
                team: {type: "select", label: "Team", options: options.team.data, value: ""},
                links: {type: "links", label: "Links", value: []},
                }
        }, (form_result, update_form) => {
            REQUESTS.post("/api/db/purchase_order", {
                code: form_result.code,
                description: form_result.description,
                status: form_result.status,
                team: form_result.team,
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
                    DOM.message("New Location", "New location created successfully.");
                }
            })
        })
    })
}