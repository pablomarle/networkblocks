let GROUP_LIST = {};

function show_edit_form(data) {
    DOM.add_form({
        title: `Edit User ${data.email}`,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            lastname: {type: "string", label: "Last Name", value: data.lastname},
        }
    }, (form_result, update_form) => {
        post("/api/users/update", {
            email: data.email,
            name: form_result.name,
            lastname: form_result.lastname,
        }, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("User Updated", `User ${data.email} updated`);
            }
        })
    })
}

function show_groups_form(data) {
    let form_selected_groups = {};
    let form_groups = {};

    for(let group_id in GROUP_LIST)
        form_groups[group_id] = GROUP_LIST[group_id].name;
    for(let element of data.groups)
        form_selected_groups[element.id] = element.name;

    DOM.add_form({
        title: `Groups of ${data.email}`,
        submit_label: "Update",
        fields: {
            groups: {type: "multiselect", label: "Selected groups", label_add: "Add new group", value: form_selected_groups, options: form_groups}
        }
    }, (form_result, update_form) => {
        let groups = [];
        for(let group_id in form_result.groups)
            groups.push(group_id);
            
        post("/api/users/groups", {
            email: data.email,
            groups: groups,
        }, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("User Updated", `User ${data.email} updated`);
            }
        })
    })
}

function show_pwdreset_form(data) {
    DOM.add_form({
        title: `PWD Reset for ${data["email"]}`,
        submit_label: "Reset",
        fields: {}
    }, (form_result, update_form) => {
        post("/api/users/password_reset", {
            email: data["email"],
        }, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                DOM.message("User PWD Reset", `Password for user ${data["email"]} changed.`);
            }
        })
    })
}

function show_activate_form(data) {
    let title = `Deactivate ${data.email}`;
    let label = "Deactivate";

    if(!data.active) {
        title = `Activate ${data.email}`;
        label = "Activate";
    }

    DOM.add_form({
        title: title,
        submit_label: label,
        fields: {}
    }, (form_result, update_form) => {
        post("/api/users/activate", {
            email: data.email,
            active: !data.active,
        }, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("User Activation", `User ${data.email} ${(data.active) ? "deactivated" : "activated"}.`);
            }
        })
    })
}

function load_datatable() {
    get("/api/users", (err, result) => {
        if(err) {
            DOM.message("Error in Users", err, true);
            return;
        }

        let table_data = [];
        for(let email in result) {
            let activate_text = "Deactivate";
            let activate_icon = "☠️";
            if(!result[email].active) {
                activate_icon = "😇";
                activate_text = "Activate";
            }
            let group_list = [];
            for(let group_id of result[email].groups) {
                group_list.push({id: group_id, name: GROUP_LIST[group_id].name})
            }
            let row_data = [
                {type: "text", text: email, name: "email"},
                {type: "text", text: result[email].name, name: "name"},
                {type: "text", text: result[email].lastname, name: "lastname"},
                {type: "list", list: group_list, name: "groups"},
                {type: "actions", actions: [
                    {label: "🖋️", description: "Edit", action: show_edit_form},
                    {label: "👥", description: "Groups", action: show_groups_form},
                    {label: "🔐", description: "Password Reset", action: show_pwdreset_form},
                    {label: activate_icon, description: activate_text, action: show_activate_form},
                ]},
                {type: "active", active: result[email].active, name: "active"},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: "List of Users",
            head: ["E-Mail", "Name", "Last Name", "Groups", "Actions"],
            body: table_data,
            filters: [ "email", "name", "lastname", "groups" ],
        }

        //DOM.add_table_data(DOM.get_id("usertable_body"), table_data);
        DOM.add_table(DOM.get_id("usertable"), table);
    });
}

function load_groups() {
    get("/api/groups", (err, result) => {
        if(err) {
            DOM.message("Error getting Groups", err, true);
            return;
        }

        GROUP_LIST = result;
        load_datatable();
    });
}

function main() {
    DOM.get_id("menu_users").style.fontWeight = "bold";

    load_groups();
    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New User");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: "New User",
            submit_label: "Create",
            fields: {
                email: {type: "string", label: "E-Mail", value: ""},
                name: {type: "string", label: "Name", value: ""},
                lastname: {type: "string", label: "Last Name", value: ""},
            }
        }, (form_result, update_form) => {
            post("/api/users/add", {
                email: form_result.email,
                name: form_result.name,
                lastname: form_result.lastname,
            }, (err, post_result) => {
                if(err) {
                    update_form(err);
                }
                else if("error" in post_result)
                    update_form(post_result.error)
                else {
                    update_form();
                    load_datatable();
                    DOM.message("New User", "New user created successfully");
                }
            })
        })
    })
}