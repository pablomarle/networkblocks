let options = {
    product: {field: "name", data: null },
    location: {field: "code", data: null },
    team: {field: "name", data: null, null_allowed: true },
    purchase_order: {field: "code", data: null, null_allowed: true },
    currency: {field: "code", data: null },
    device: {field: "name", data: null, null_allowed: true },
    rack: {field: "name", data: null, null_allowed: true },
}

function show_edit_form(data, read_only = false) {
    let title = `Edit ${data.serial_number}`;
    if(read_only)
        title = data.serial_number;

    DOM.add_form({
        title: title,
        submit_label: "Update",
        fields: {
            serial_number: {type: "string", label: "SN", value: data.serial_number},
            mac_address: {type: "string", label: "MAC Address", value: data.mac_address},
            product: {type: "select", label: "Product", options: options.product.data, value: data.product},
            location: {type: "select", label: "Location", options: options.location.data, value: data.location},
            owner: {type: "select", label: "Owner", options: options.team.data, value: data.owner},
            rack: {type: "select", label: "Rack", options: options.rack.data, value: data.rack},
            purchase_order: {type: "select", label: "PO", options: options.purchase_order.data, value: data.purchase_order},
            value: {type: "string", label: "Value", value: data.value},
            currency: {type: "select", label: "Currency", options: options.currency.data, value: data.currency},
            links: {type: "links", label: "Links", value: data.links},
        }
    }, (form_result, update_form) => {
        REQUESTS.post(`/api/db/asset/${data.id}`, {fields: {
            serial_number: form_result.serial_number,
            mac_address: form_result.mac_address,
            product: form_result.product,
            location: form_result.location,
            owner: form_result.owner,
            rack: form_result.rack,
            purchase_order: form_result.purchase_order,
            value: parseFloat(form_result.value),
            currency: form_result.currency,
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
                DOM.message("Asset Updated", `Asset ${post_result.fields.serial_number} updated`);
            }
        })
    }, read_only);
}

function show_delete_form(data) {
    DOM.add_form({
        title: `Delete ${data["seria_number"]}?`,
        submit_label: "Delete",
        fields: {}
    }, (form_result, update_form) => {
        REQUESTS.delete(`/api/db/asset/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Asset deleted", `Asset ${data["seria_number"]} deleted.`);
            }
        })
    })
}

function show_view_form(data) {
    show_edit_form(data, true);
}

function show_docs_form(data) {
    let docs_form = add_docs_management("asset", data.id, "documents", data.documents, () => {
        DOM.destroy(docs_form);
        load_datatable();
        show_docs_form(data);
    });
}

function load_datatable() {
    REQUESTS.get("/api/db/asset", (err, result) => {
        if(err) {
            DOM.message("Error getting Assets", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting Assets", result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.serial_number, name: "serial_number"},
                {type: "text", text: result[id].fields.mac_address, name: "mac_address"},
                {type: "text", text: result[id].fields.product, name: "product", hidden: true},
                {type: "text", text: options.product.data[result[id].fields.product], name: "product_name"},
                {type: "text", text: result[id].fields.location, name: "location", hidden: true},
                {type: "text", text: options.location.data[result[id].fields.location], name: "location_name"},
                {type: "text", text: result[id].fields.owner, name: "owner", hidden: true},
                {type: "text", text: options.team.data[result[id].fields.owner], name: "owner_name"},
                {type: "text", text: result[id].fields.rack, name: "rack", hidden: true},
                {type: "text", text: options.rack.data[result[id].fields.rack], name: "rack_name"},
                {type: "text", text: result[id].fields.purchase_order, name: "purchase_order", hidden: true},
                {type: "text", text: options.purchase_order.data[result[id].fields.purchase_order], name: "purchase_order_name"},
                {type: "text", text: result[id].fields.value, name: "value", hidden: true},
                {type: "text", text: result[id].fields.currency, name: "currency", hidden: true},
                {type: "text", text: `${result[id].fields.value} ${options.currency.data[result[id].fields.currency]}`, name: "value_name"},
                {type: "linklist", name: "links", list: result[id].fields.links},
                {type: "doclist", name: "documents", docs: result[id].fields.documents, baseurl: `/api/db/asset/${id}/download/documents`},
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
            caption: "List of Assets",
            head: ["Serial Number", "MAC Address", "Product", "Location", "Owner", "Rack", "PO", "Value", "Links", "Docs", "Actions"],
            body: table_data,
            filters: [ "serial_number", "mac_address", "product_name", "location_name", "owner_name", "rack_name", "purchase_order_name"],
        }

        //DOM.add_table_data(DOM.get_id("usertable_body"), table_data);
        DOM.add_table(DOM.get_id("locationtable"), table);
    });
}

function main() {
    DOM.get_id("menu_asset").style.fontWeight = "bold";

    load_options(options, load_datatable);

    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New Asset");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: "New Asset",
            submit_label: "Create",
            fields: {
                serial_number: {type: "string", label: "SN", value: ""},
                mac_address: {type: "string", label: "MAC Address", value: "00:00:00:00:00:00"},
                product: {type: "select", label: "Product", options: options.product.data, value: ""},
                location: {type: "select", label: "Location", options: options.location.data, value: ""},
                owner: {type: "select", label: "Owner", options: options.team.data, value: ""},
                purchase_order: {type: "select", label: "PO", options: options.purchase_order.data, value: ""},
                value: {type: "string", label: "Value", value: ""},
                currency: {type: "select", label: "Currency", options: options.currency.data, value: ""},
                links: {type: "links", label: "Links", value: []},
            }
        }, (form_result, update_form) => {
            if(isNaN(form_result.value) || (form_result.value < 0)) {
                update_form("Value must be a positive number.");
                return;
            }

            REQUESTS.post("/api/db/asset", {
                serial_number: form_result.serial_number,
                mac_address: form_result.mac_address,
                product: form_result.product,
                location: form_result.location,
                owner: form_result.owner,
                purchase_order: form_result.purchase_order,
                value: parseFloat(form_result.value),
                currency: form_result.currency,
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
                    DOM.message("New Asset", "New asset created successfully.");
                }
            })
        })
    })
}