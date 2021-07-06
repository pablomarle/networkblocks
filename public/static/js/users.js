let group_list = [];

function show_edit_form(data) {
    DOM.add_form({
        title: `Edit User ${data[0]}`,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data[1]},
            lastname: {type: "string", label: "Last Name", value: data[2]},
        }
    }, (form_result, update_form) => {
        console.log(form_result);
        post("/api/users/update", {
            email: data[0],
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
                DOM.message("User Updated", `User ${data[0]} updated`);
            }
        })
    })
}

function show_groups_form(data) {
    DOM.add_form({
        title: `Groups of ${data[0]}`,
        submit_label: "Update",
        fields: {
            groups: {type: "multiselect", value: data[3], options: group_list}
        }
    }, (form_result, update_form) => {

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
    console.log(data);
    DOM.add_form({
        title: `PWD Reset for ${data[0]}`,
        submit_label: "Reset",
        fields: {}
    }, (form_result, update_form) => {
        post("/api/users/password_reset", {
            email: data[0],
        }, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                DOM.message("User PWD Reset", `Password for user ${data[0]} changed.`);
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
            let row_data = [
                {type: "text", text: email, name: "email"},
                {type: "text", text: result[email].name, name: "name"},
                {type: "text", text: result[email].lastname, name: "lastname"},
                {type: "list", list: result[email].groups, name: "groups"},
                {type: "actions", actions: [
                    {label: "🖋️", description: "Edit", action: show_edit_form},
                    {label: "🏭", description: "Groups", action: show_groups_form},
                    {label: "🔐", description: "Password Reset", action: show_pwdreset_form},
                    {label: "☠️", description: "Activate/Deactivate", action: show_activate_form},
                ]},
                {type: "active", active: result[email].active},
            ];
            table_data.push(row_data);
        }
        DOM.add_table_data(DOM.get_id("usertable_body"), table_data);
    });
}

function load_groups() {
    get("/api/groups", (err, result) => {
        if(err) {
            DOM.message("Error getting Groups", err, true);
            return;
        }

        for(let group in result)
            group_list.push(group);
    });
}

function main() {
    load_groups();
    load_datatable();

    DOM.get_id("new_user").addEventListener("click", () => {
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