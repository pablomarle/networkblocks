let team = null;
let status = null;
let options_team = null;
let options_status = null;

function show_edit_form(data, read_only = false) {
    let title = `Edit ${data.name}`;
    if(read_only)
        title = data.name;

    DOM.add_form({
        title: title,
        submit_label: "Update",
        fields: {
            code: {type: "string", label: "Code", value: data.code},
            description: {type: "string", label: "Description", value: data.description},
            status: {type: "select", label: "Category", options: options_status, value: data.status},
            team: {type: "select", label: "Region", options: options_team, value: data.team},
        }
}, (form_result, update_form) => {
        REQUESTS.post(`/api/db/purchase_order/${data.id}`, {fields: {
            code: form_result.code,
            description: form_result.description,
            status: form_result.status,
            team: form_result.team,
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
                {type: "text", text: options_status[result[id].fields.status], name: "status_name", hidden: false},
                {type: "text", text: result[id].fields.team, name: "team", hidden: true},
                {type: "text", text: options_team[result[id].fields.team], name: "team_name"},
                {type: "actions", actions: [
                    {label: "🔍", description: "View", action: show_view_form },
                    {label: "🖋️", description: "Edit", action: show_edit_form },
                    {label: "☠️", description: "Delete", action: show_delete_form },
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: "List of POs",
            head: ["Code", "Description", "Status", "Team", "Actions"],
            body: table_data,
            filters: [ "code", "description", "status_name", "team_name"],
        }

        //DOM.add_table_data(DOM.get_id("usertable_body"), table_data);
        DOM.add_table(DOM.get_id("locationtable"), table);
    });
}

function load_status() {
    REQUESTS.get("/api/db/purchase_order_status", (err, result) => {
        if(err) {
            DOM.message("Error", `Error loading status: ${err}`);
        }
        else if("error" in result)
            DOM.message("Error", `Error loading status: ${result.error}`);

        status = result;
        options_status = {};
        for(let status_id in status)
            options_status[status_id] = status[status_id].fields.name;

        if(status && team) {
            load_datatable();
        }
    });
}

function load_teams() {
    REQUESTS.get("/api/db/team", (err, result) => {
        if(err) {
            DOM.message("Error", `Error loading teams: ${err}`);
        }
        else if("error" in result)
            DOM.message("Error", `Error loading teams: ${result.error}`);

        team = result;
        options_team = {};
        for(let team_id in team)
            options_team[team_id] = team[team_id].fields.name;

        if(status && team) {
            load_datatable();
        }
    });
}

function main() {
    DOM.get_id("menu_po").style.fontWeight = "bold";

    load_teams();
    load_status();

    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New PO");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: "New Location",
            submit_label: "Create",
            fields: {
                name: {type: "string", label: "Name", value: ""},
                code: {type: "string", label: "Code", value: ""},
                description: {type: "string", label: "Description", value: ""},
                address: {type: "string", label: "Address", value: ""},
                city: {type: "string", label: "City", value: ""},
                state: {type: "string", label: "State", value: ""},
                country: {type: "string", label: "Country", value: ""},
                zip: {type: "string", label: "ZIP", value: ""},
                contact_name: {type: "string", label: "Contact Name", value: ""},
                contact_email: {type: "string", label: "Contact e-mail", value: ""},
                contact_phone: {type: "string", label: "Contact Phone", value: ""},
                category: {type: "select", label: "Category", options: options_category, value: ""},
                region: {type: "select", label: "Region", options: options_region, value: ""},
            }
        }, (form_result, update_form) => {
            REQUESTS.post("/api/db/location", {
                name: form_result.name,
                code: form_result.code,
                description: form_result.description,
                address: form_result.address,
                city: form_result.city,
                state: form_result.state,
                country: form_result.country,
                zip: form_result.zip,
                contact_name: form_result.contact_name,
                contact_email: form_result.contact_email,
                contact_phone: form_result.contact_phone,
                category: form_result.category,
                region: form_result.region,
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