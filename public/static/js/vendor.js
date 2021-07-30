function show_edit_form(data) {
    DOM.add_form({
        title: `Edit ${data.name}`,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            description: {type: "string", label: "Description", value: data.description},
            contact_name: {type: "string", label: "Contact", value: data.contact_name},
            contact_email: {type: "string", label: "E-Mail", value: data.contact_email},
            contact_phone: {type: "string", label: "Phone", value: data.contact_phone},
        }
    }, (form_result, update_form) => {
        REQUESTS.post(`/api/db/vendor/${data.id}`, {fields: {
            name: form_result.name,
            description: form_result.description,
            contact_name: form_result.contact_name,
            contact_email: form_result.contact_email,
            contact_phone: form_result.contact_phone,
        }}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Vendor Updated", `Vendor ${data.name} updated`);
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
        REQUESTS.delete(`/api/db/vendor/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Vendor deleted", `Vendor ${data["name"]} deleted.`);
            }
        })
    })
}

function load_datatable() {
    REQUESTS.get("/api/db/vendor", (err, result) => {
        if(err) {
            DOM.message("Error in Vendor", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting Vendors", result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.name, name: "name"},
                {type: "text", text: result[id].fields.description, name: "description"},
                {type: "text", text: result[id].fields.contact_name, name: "contact_name"},
                {type: "text", text: result[id].fields.contact_email, name: "contact_email"},
                {type: "text", text: result[id].fields.contact_phone, name: "contact_phone"},
                {type: "actions", actions: [
                    {label: "🖋️", description: "Edit", action: show_edit_form},
                    {label: "☠️", description: "Delete", action: show_delete_form},
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: "List of Vendors",
            head: ["Name", "Description", "Contact", "E-Mail", "Phone", "Actions"],
            body: table_data,
            filters: [ "name", "description", "contact_name", "contact_email", "contact_phone"],
        }

        DOM.add_table(DOM.get_id("locationtable"), table);
    });
}

function main() {
    DOM.get_id("menu_vendor").style.fontWeight = "bold";

    load_datatable();

    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New Vendor");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: "New Vendor",
            submit_label: "Create",
            fields: {
                name: {type: "string", label: "Name", value: ""},
                description: {type: "string", label: "Description", value: ""},
                contact_name: {type: "string", label: "Contact", value: ""},
                contact_email: {type: "string", label: "E-Mail", value: ""},
                contact_phone: {type: "string", label: "Phone", value: ""},
            }
        }, (form_result, update_form) => {
            REQUESTS.post("/api/db/vendor", {
                name: form_result.name,
                description: form_result.description,
                contact_name: form_result.contact_name,
                contact_email: form_result.contact_email,
                contact_phone: form_result.contact_phone,
            }, (err, post_result) => {
                if(err) {
                    update_form(err);
                }
                else if("error" in post_result)
                    update_form(post_result.error)
                else {
                    update_form();
                    load_datatable();
                    DOM.message("New Vendor", "New vendor created successfully.");
                }
            })
        })
    })
}