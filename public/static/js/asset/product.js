let options = {
    vendor: {field: "name", data: null, null_allowed: false },
    product_category: {field: "name", data: null, null_allowed: false },
    currency: {field: "name", data: null, null_allowed: false },
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
            part_number: {type: "string", label: "Part Number", value: data.part_number},
            description: {type: "multistring", label: "Description", value: data.description},
            category: {type: "select", label: "Category", options: options.product_category.data, value: data.category},
            vendor: {type: "select", label: "Vendor", options: options.vendor.data, value: data.vendor},
            price: {type: "string", label: "Price", value: data.price},
            currency: {type: "select", label: "Currency", options: options.currency.data, value: data.currency},
            links: {type: "links", label: "Links", value: data.links},
        }
}, (form_result, update_form) => {
        if(isNaN(form_result.price) || (form_result.price < 0)) {
            update_form("Price must be a positive number.");
            return;
        }

        REQUESTS.post(`/api/db/product/${data.id}`, {fields: {
            name: form_result.name,
            part_number: form_result.part_number,
            description: form_result.description,
            category: form_result.category,
            vendor: form_result.vendor,
            price: parseFloat(form_result.price),
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
                DOM.message("Product Updated", `Product ${data.name} updated`);
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
        REQUESTS.delete(`/api/db/product/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Product deleted", `Product ${data["name"]} deleted.`);
            }
        })
    })
}

function show_view_form(data) {
    show_edit_form(data, true);
}

function show_docs_form(data) {
    let docs_form = add_docs_management("product", data.id, "documents", data.documents, () => {
        DOM.destroy(docs_form);
        load_datatable();
        show_docs_form(data);
    });
}

function load_datatable() {
    REQUESTS.get("/api/db/product", (err, result) => {
        if(err) {
            DOM.message("Error getting Products", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting Products", result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.name, name: "name"},
                {type: "text", text: result[id].fields.part_number, name: "part_number"},
                {type: "text", text: result[id].fields.description, name: "description", hidden: true},
                {type: "text", text: result[id].fields.category, name: "category", hidden: true},
                {type: "text", text: options.product_category.data[result[id].fields.category], name: "category_name", hidden: false},
                {type: "text", text: result[id].fields.vendor, name: "vendor", hidden: true},
                {type: "text", text: options.vendor.data[result[id].fields.vendor], name: "vendor_name"},
                {type: "text", text: result[id].fields.price, name: "price", hidden: true},
                {type: "text", text: result[id].fields.currency, name: "currency", hidden: true},
                {type: "text", text: `${result[id].fields.price} ${options.currency.data[result[id].fields.currency]}`, name: "price_text"},
                {type: "linklist", name: "links", list: result[id].fields.links},
                {type: "doclist", name: "documents", docs: result[id].fields.documents, baseurl: `/api/db/product/${id}/download/documents`},
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
            caption: "List of Products",
            head: ["Name", "Part #", "Category", "Vendor", "Price", "Links", "Docs", "Actions"],
            body: table_data,
            filters: [ "name", "part_number", "category_name", "vendor_name"],
        }

        //DOM.add_table_data(DOM.get_id("usertable_body"), table_data);
        DOM.add_table(DOM.get_id("locationtable"), table);
    });
}

function main() {
    DOM.get_id("menu_product").style.fontWeight = "bold";

    load_options(options, load_datatable);

    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New Product");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: "New Product",
            submit_label: "Create",
            fields: {
                name: {type: "string", label: "Name", value: ""},
                part_number: {type: "string", label: "Part Number", value: ""},
                description: {type: "multistring", label: "Description", value: ""},
                category: {type: "select", label: "Category", options: options.product_category.data, value: ""},
                vendor: {type: "select", label: "Vendor", options: options.vendor.data, value: ""},
                price: {type: "string", label: "Price", value: ""},
                currency: {type: "select", label: "Currency", options: options.currency.data, value: ""},
                links: {type: "links", label: "Links", value: []},
            }
        }, (form_result, update_form) => {
            if(isNaN(form_result.price) || (form_result.price < 0)) {
                update_form("Price must be a positive number.");
                return;
            }
            REQUESTS.post("/api/db/product", {
                name: form_result.name,
                part_number: form_result.part_number,
                description: form_result.description,
                category: form_result.category,
                vendor: form_result.vendor,
                price: parseFloat(form_result.price),
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
                    DOM.message("New Product", "New product created successfully.");
                }
            })
        })
    })
}