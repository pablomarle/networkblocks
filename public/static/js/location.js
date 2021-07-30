let regions = null;
let categories = null;
let options_category = null;
let options_region = null;

function show_edit_form(data, read_only = false) {
    let title = `Edit ${data.name}`;
    if(read_only)
        title = data.name;

    DOM.add_form({
        title: title,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            code: {type: "string", label: "Code", value: data.code},
            description: {type: "string", label: "Description", value: data.description},
            address: {type: "string", label: "Address", value: data.address},
            city: {type: "string", label: "City", value: data.city},
            state: {type: "string", label: "State", value: data.state},
            country: {type: "string", label: "Country", value: data.country},
            zip: {type: "string", label: "ZIP", value: data.zip},
            contact_name: {type: "string", label: "Contact Name", value: data.contact_name},
            contact_email: {type: "string", label: "Contact e-mail", value: data.contact_email},
            contact_phone: {type: "string", label: "Contact Phone", value: data.contact_phone},
            category: {type: "select", label: "Category", options: options_category, value: data.category},
            region: {type: "select", label: "Region", options: options_region, value: data.region},
        }
}, (form_result, update_form) => {
        REQUESTS.post(`/api/db/location/${data.id}`, {fields: {
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
        }}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Location Updated", `Location ${data.name} updated`);
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
        REQUESTS.delete(`/api/db/location/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Location deleted", `Location ${data["name"]} deleted.`);
            }
        })
    })
}

function show_view_form(data) {
    show_edit_form(data, true);
}

function load_datatable() {
    REQUESTS.get("/api/db/location", (err, result) => {
        if(err) {
            DOM.message("Error getting Locations", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting Locations", result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.code, name: "code"},
                {type: "text", text: result[id].fields.name, name: "name"},
                {type: "text", text: result[id].fields.description, name: "description", hidden: true},
                {type: "text", text: result[id].fields.address, name: "address", hidden: true},
                {type: "text", text: result[id].fields.city, name: "city"},
                {type: "text", text: result[id].fields.state, name: "state", hidden: true},
                {type: "text", text: result[id].fields.country, name: "country"},
                {type: "text", text: result[id].fields.zip, name: "zip", hidden: true},
                {type: "text", text: result[id].fields.contact_name, name: "contact_name", hidden: true},
                {type: "text", text: result[id].fields.contact_email, name: "contact_email", hidden: true},
                {type: "text", text: result[id].fields.contact_phone, name: "contact_phone", hidden: true},
                {type: "text", text: result[id].fields.category, name: "category", hidden: true},
                {type: "text", text: options_category[result[id].fields.category], name: "category_name", hidden: false},
                {type: "text", text: result[id].fields.region, name: "region", hidden: true},
                {type: "text", text: options_region[result[id].fields.region], name: "region_name"},
                {type: "actions", actions: [
                    {label: "🔍", description: "View", action: show_view_form },
                    {label: "🖋️", description: "Edit", action: show_edit_form },
                    {label: "☠️", description: "Delete", action: show_delete_form },
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: "List of Locations",
            head: ["Code", "Name", "City", "Country", "Category", "Region", "Actions"],
            body: table_data,
            filters: [ "code", "name", "city", "country", "category_name", "region_name"],
        }

        //DOM.add_table_data(DOM.get_id("usertable_body"), table_data);
        DOM.add_table(DOM.get_id("locationtable"), table);
    });
}

function load_regions() {
    REQUESTS.get("/api/db/region", (err, result) => {
        if(err) {
            DOM.message("Error", `Error loading regions: ${err}`);
        }
        else if("error" in result)
            DOM.message("Error", `Error loading regions: ${result.error}`);

        regions = result;
        options_region = {};
        for(let region_id in regions)
            options_region[region_id] = regions[region_id].fields.name;

        if(regions && categories) {
            load_datatable();
        }
    });
}

function load_categories() {
    REQUESTS.get("/api/db/location_category", (err, result) => {
        if(err) {
            DOM.message("Error", `Error loading categories: ${err}`);
        }
        else if("error" in result)
            DOM.message("Error", `Error loading categories: ${result.error}`);

        categories = result;
        options_category = {};
        for(let category_id in categories)
            options_category[category_id] = categories[category_id].fields.name;

        if(regions && categories) {
            load_datatable();
        }
    });
}

function main() {
    DOM.get_id("menu_location").style.fontWeight = "bold";

    load_regions();
    load_categories();

    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New Location");
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