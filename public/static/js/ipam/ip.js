let options = {
    ipam_function: {field: "name", data: null, null_allowed: true },
    environment: {field: "name", data: null, null_allowed: true },
    team: {field: "name", data: null, null_allowed: true },
    location: {field: "code", data: null, null_allowed: true },
}

let nav_bar = null;
let ipam_tree = null;

function show_edit_form(data, read_only = false) {
    let title = `Edit ${data.address}`;
    if(read_only)
        title = data.name;

    DOM.add_form({
        title: title,
        submit_label: "Update",
        fields: {
            address: {type: "string", label: "Address", value: data.address},
            description: {type: "multistring", label: "Description", value: data.description},
            location: {type: "select", label: "Location", options: options.location.data, value: data.location},
            owner: {type: "select", label: "Owner", options: options.team.data, value: data.owner},
            environment: {type: "select", label: "Environment", options: options.environment.data, value: data.environment},
            function: {type: "select", label: "Function", options: options.ipam_function.data, value: data.function},
        }
    }, (form_result, update_form) => {
        REQUESTS.post(`/api/db/network/${data.id}`, {fields: {
            address: form_result.address,
            description: form_result.description,
            location: form_result.location,
            owner: form_result.owner,
            environment: form_result.environment,
            function: form_result.function,
        }}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_data();
                DOM.message(`Network Updated`, `Network ${post_result.fields.address} updated`);
            }
        })
    }, read_only);
}

function show_view_form(data) {
    show_edit_form(data, true);
}

function show_delete_form(data) {
    DOM.add_form({
        title: `Delete ${data.address}?`,
        submit_label: "Delete",
        fields: {}
    }, (form_result, update_form) => {
        REQUESTS.delete(`/api/db/network/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_data();
                DOM.message(`Network deleted`, `Network ${data.address} deleted.`);
            }
        })
    })
}

function navigate_sublevel(data) {
    DOM.navbar_add(nav_bar, data.address);
    show_datatable();
}

function show_datatable() {
    let current_level = 1;
    let current_branch = ipam_tree;
    let current_element = "root";

    // Find the element on the tree to draw
    while(current_level < nav_bar.elements.length) {
        let new_branch = null;
        for(let entry of current_branch) {
            if(entry.data.fields.address == nav_bar.elements[current_level]) {
                new_branch = entry.subnetworks;
                current_element = nav_bar.elements[current_level];
                break;
            }
        }
        if(new_branch) {
            current_level++;
            current_branch = new_branch;
        }
        else {
            DOM.navbar_click(nav_bar, current_element);
            return;
        }
    }

    let table_data = [];
    for(let entry of current_branch) {
        let row_data = [
            {type: "text", text: entry.id, name: "id", hidden: true},
            {type: "text", text: entry.data.fields.address, name: "address", hidden: true},
            {type: "text", text: compressIPV6(entry.data.fields.address), name: "address_compressed"},
            {type: "text", text: entry.data.fields.description, name: "description", hidden: true},
            {type: "text", text: entry.data.fields.location, name: "location", hidden: true},
            {type: "text", text: options.location.data[entry.data.fields.location], name: "location_name"},
            {type: "text", text: entry.data.fields.owner, name: "owner", hidden: true},
            {type: "text", text: options.team.data[entry.data.fields.owner], name: "owner_name"},
            {type: "text", text: entry.data.fields.environment, name: "environment", hidden: true},
            {type: "text", text: options.environment.data[entry.data.fields.environment], name: "environment_name"},
            {type: "text", text: entry.data.fields.function, name: "function", hidden: true},
            {type: "text", text: options.ipam_function.data[entry.data.fields.function], name: "function_name"},
            //{type: "text", text: entry.subnetworks.length, name: "n_subnets"},
            {type: "actions", actions: (entry.subnetworks.length > 0) ? [
                {label: entry.subnetworks.length, description: "View Subnets", action: navigate_sublevel },
            ] : []},
            {type: "actions", actions: [
                {label: "🔍", description: "View", action: show_view_form },
                {label: "🖋️", description: "Edit", action: show_edit_form },
                {label: "☠️", description: "Delete", action: show_delete_form },
                //{label: "➥", description: "View Subnets", action: navigate_sublevel },
            ]},
        ]
        table_data.push(row_data)
    }

    let table = {
        caption: `List of Networks`,
        head: ["Address", "Location", "Owner", "Environment", "Function", "# subnets", "Actions"],
        body: table_data,
        filters: [ "address_compressed", "location_name", "owner_name", "environment_name", "function_name"],
    }

    DOM.add_table(DOM.get_id("datatable"), table);

}

function load_data() {
    REQUESTS.get("/ip/tree", (err, result) => {
        if(err) {
            DOM.message("Error getting Network List", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting Network List", result["error"], true);
            return;
        }

        ipam_tree = result.data;
        show_datatable();
    });
}

function main() {
    DOM.get_id("menu_ip").style.fontWeight = "bold";
    nav_bar = DOM.navbar_create(DOM.get_id("nav_bar"), "root", (element) => {
        show_datatable();
    })

    load_options(options, load_data);

    let new_button = DOM.get_id("new_element");
    DOM.add_text(new_button, "New network");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: `New Network`,
            submit_label: "Create",
            fields: {
                address: {type: "string", label: "Address", value: ""},
                description: {type: "multistring", label: "Description", value: ""},
                location: {type: "select", label: "Location", options: options.location.data, value: ""},
                owner: {type: "select", label: "Owner", options: options.team.data, value: ""},
                environment: {type: "select", label: "Environment", options: options.environment.data, value: ""},
                function: {type: "select", label: "Function", options: options.ipam_function.data, value: ""},
               }
        }, (form_result, update_form) => {
            REQUESTS.post(`/api/db/network`, {
                address: form_result.address,
                description: form_result.description,
                location: form_result.location,
                owner: form_result.owner,
                environment: form_result.environment,
                function: form_result.function,
            }, (err, post_result) => {
                if(err) {
                    update_form(err);
                }
                else if("error" in post_result)
                    update_form(post_result.error)
                else {
                    update_form();
                    load_data();
                    DOM.message(`New Network`, `New network created successfully.`);
                }
            })
        })
    })
}