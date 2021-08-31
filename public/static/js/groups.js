const PERMISSIONS = {
    super_user: "Super User",
    ipam_ro: "IPAM RO",
    ipam_rw: "IPAM RW",
    assets_ro: "Assets RO",
    assets_rw: "Assets RW",
    users_ro: "Users RO",
    users_rw: "Users RW",
    devices_ro: "Devices RO",
    devices_rw: "Devices RW",
}

function show_edit_form(data) {
    DOM.add_form({
        title: `Edit Group ${data.name}`,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            description: {type: "string", label: "Description", value: data.description},
        }
    }, (form_result, update_form) => {
        REQUESTS.post("/api/groups/update", {
            id: data.id,
            name: form_result.name,
            description: form_result.description,
        }, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Group Updated", `Group ${data.name} updated`);
            }
        })
    })
}

function show_permissions_form(data) {
    let current_permissions = {};

    for(let permission of data.permissions) {
        current_permissions[permission.id] = PERMISSIONS[permission.id];
    }

    DOM.add_form({
        title: `Permissions of ${data.name}`,
        submit_label: "Update",
        fields: {
            permissions: {type: "multiselect", label: "Permissions", label_add: "Add new permission", value: current_permissions, options: PERMISSIONS}
        }
    }, (form_result, update_form) => {
        let permissions = [];
        for(let permission in form_result.permissions)
            permissions.push(permission);
            
        REQUESTS.post("/api/groups/permissions", {
            id: data.id,
            permissions: permissions,
        }, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Group Updated", `Group ${data.name} updated`);
            }
        })
    })

}

function show_delete_form(data) {
    DOM.add_form({
        title: `Delete ${data["name"]}`,
        submit_label: "Delete",
        fields: {}
    }, (form_result, update_form) => {
        REQUESTS.post("/api/groups/delete", {
            id: data["id"],
        }, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Group deleted", `Group ${data["name"]} deleted.`);
            }
        })
    })
}

function load_datatable() {
    REQUESTS.get("/api/groups", (err, result) => {
        if(err) {
            DOM.message("Error in Groups", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting Groups", result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let permission_list = [];
            for(let permission of result[id].permissions)
                permission_list.push({id: permission, name: PERMISSIONS[permission]})

            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].name, name: "name"},
                {type: "text", text: result[id].description, name: "description"},
                {type: "list", list: permission_list, name: "permissions"},
                {type: "actions", actions: [
                    {label: "🖋️", description: "Edit", action: show_edit_form},
                    {label: "🔐", description: "Group Permissions", action: show_permissions_form},
                    {label: "☠️", description: "Delete", action: show_delete_form},
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: "List of Groups",
            head: ["Name", "Description", "Permissions", "Actions"],
            body: table_data,
            filters: [ "name", "description", "permissions"],
        }

        //DOM.add_table_data(DOM.get_id("usertable_body"), table_data);
        DOM.add_table(DOM.get_id("usertable"), table);
    });
}

function main() {
    DOM.get_id("menu_groups").style.fontWeight = "bold";

    load_datatable();

    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New Group");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: "New Group",
            submit_label: "Create",
            fields: {
                name: {type: "string", label: "Name", value: ""},
                description: {type: "string", label: "Description", value: ""},
            }
        }, (form_result, update_form) => {
            REQUESTS.post("/api/groups/add", {
                name: form_result.name,
                description: form_result.description,
            }, (err, post_result) => {
                if(err) {
                    update_form(err);
                }
                else if("error" in post_result)
                    update_form(post_result.error)
                else {
                    update_form();
                    load_datatable();
                    DOM.message("New Group", "New group created successfully.");
                }
            })
        })
    })
}