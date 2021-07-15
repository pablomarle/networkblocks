function main() {
    post("/api/users/get", {email: USERDATA.user}, (err, result) => {
        if(err) {
            DOM.message("Error", err, true);
            return;
        }
        
        DOM.get_id("name").value = result.name;
        DOM.get_id("lastname").value = result.lastname;
        let dom_groups = document.getElementById("groups");

        for(let group_id in result.groups) {
            DOM.add_div(dom_groups, result.groups[group_id], null, "form_list_element");
        }

        DOM.set_click("change_data", () => {
            post("/api/users/update", {
                    email: USERDATA.user,
                    name: DOM.get_value("name"),
                    lastname: DOM.get_value("lastname"),
                },
                (err, result) => {
                    if(err) {
                        DOM.message("Error", err, true);
                        return;
                    }
                    if("error" in result) {
                        DOM.set_text(DOM.get_id("message_user_data"), result["error"]);
                    }
                    else {
                        DOM.empty(DOM.get_id("message_user_data"));
                        DOM.message("User Update", "User has been updated");
                    }
                }
            );
        });

        DOM.set_click("change_password", () => {
            let new_password = DOM.get_value("new_password");
            let new_password2 = DOM.get_value("new_password2");
            if(new_password !== new_password2) {
                DOM.set_text(DOM.get_id("message_password_change"), "New passwords don't match.");
                return;
            }
            post("/api/users/password", {
                    email: USERDATA.user,
                    old_password: DOM.get_value("old_password"),
                    new_password: new_password,
                },
                (err, result) => {
                    if(err) {
                        DOM.message("Error", err, true);
                        return;
                    }
                    if("error" in result) {
                        DOM.set_text(DOM.get_id("message_password_change"), result["error"]);
                    }
                    else {
                        DOM.empty(DOM.get_id("message_user_data"));
                        DOM.message("User Update", "Password changed.");
                    }                    
                }
            );
        })
    })
}