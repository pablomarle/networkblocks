const DOM = {
    destroy: (e) => {
        e.parentNode.removeChild(e);
    },

    empty: (e) => {
        while(e.lastChild)
            e.removeChild(e.lastChild);
    },

    get_id: (id) => {
        return document.getElementById(id);
    },

    get_value: (id) => {
        return document.getElementById(id).value;
    },

    set_click: (id, action) => {
        document.getElementById(id).addEventListener("click", action);
    },

    add_text: (e, text, id, class_name) => {
        let etext = document.createTextNode(text);
        e.appendChild(etext);
    },
    
    add_element: (e, type, text, id, class_name) => {
        let div = document.createElement(type);
        
        if(text)
            DOM.add_text(div, text);
        
        if(id)
            div.id = id;

        if(class_name)
            div.classList.add(class_name);

        e.appendChild(div);

        return div;
    },

    add_div: (e, text, id, class_name) => {
        return DOM.add_element(e, "div", text, id, class_name);
    },

    add_span: (e, text, id, class_name) => {
        return DOM.add_element(e, "span", text, id, class_name);
    },

    add_label: (e, text, label_for, id, class_name) => {
        let label = DOM.add_element(e, "label", text, id, class_name);
        label.htmlFor = label_for;
        return label;
    },

    add_input: (e, value, id, class_name) => {
        let input = DOM.add_element(e, "input", null, id, class_name);
        input.value = value;
        return input;
    },

    add_button: (e, text, id, class_name, callback) => {
        let button = DOM.add_element(e, "button", text, id, class_name);
        button.addEventListener("click", callback);
        return button;
    },

    set_text: (e, text) => {
        DOM.empty(e);
        DOM.add_text(e, text);
    },

    add_table_data: (e, data) => {
        DOM.empty(e);

        for(let row of data) {
            let data = {};
            let tr = document.createElement("tr");
            e.appendChild(tr);
            for(let element of row) {
                let td = document.createElement("td");
                tr.appendChild(td);
                if(element.type === "text") {
                    let text = document.createTextNode(element.text);
                    td.appendChild(text);
                    data[element.name] = element.text;
                }
                else if(element.type === "list") {
                    for(let list_item of element.list) {
                        let div = DOM.add_span(td, list_item, null, "datatable_listitem");
                        td.appendChild(div);
                    }
                    data[element.name] = element.list;
                }
                else if(element.type === "actions") {
                    for(let action of element.actions) {
                        let button = DOM.add_button(td, action.label, null, null, () => {
                            action.action(data);
                        });
                        button.title = action.description;
                    }
                }
                else if(element.type === "active") {
                    data[element.name] = element.active;
                    if(!element.active) {
                        tr.style.background = "#FF0000";
                    }
                }
            }
        }
    },

    add_form: (form_data, callback) => {
        let form_info = {};

        let container = DOM.add_div(document.body, null, null, "ff_container");
        let form = DOM.add_div(container, null, null, "ff_form");
        let title = DOM.add_div(form, form_data.title, null, "ff_title");
    
        let close = DOM.add_div(title, "x", null, "ff_close");
        close.addEventListener("click", () => {
            DOM.destroy(container);
        });

        let error_dom = DOM.add_div(form, null, null, "ff_row_error");

        for(let field_name in form_data.fields) {
            let field_data = form_data.fields[field_name];
            let row = DOM.add_div(form, null, null, "ff_row");
            DOM.add_label(row, field_data.label, "ff_field_" + field_name, null, "form_label");

            if(field_data.type === "string") {
                form_info[field_name] = DOM.add_input(row, field_data.value, "ff_field_" + field_name, "form_input_long");
            }
            else if(field_data.type === "multiselect") {
                form_info[field_name] = [...field_data.value];
                let ms_container = DOM.add_div(row, null, null, "ff_multiselect");

                let update_multiselect = () => {
                    DOM.empty(ms_container);
                    for(let entry of form_info[field_name]) {
                        let ms_entry = DOM.add_div(ms_container, null, null, "ff_multiselect_entry");
                        let ms_object = DOM.add_div(ms_entry, entry);
                    }
                }

                update_multiselect();

            }
        }

        let row = DOM.add_div(form, null, null, "ff_row");
        DOM.add_button(row, form_data.submit_label, null, "form_button", () => {
            let data = {};
            for(let field_name in form_info) {
                let field_data = form_data.fields[field_name];
                if(field_data.type == "string")
                    data[field_name] = form_info[field_name].value;
                else if(field_data.type == "multiselect")
                    data[field_name] = form_info[field_name];
            }

            let result = callback(data, (err) => {
                if(err)
                    DOM.set_text(error_dom, err);
                else
                    DOM.destroy(container);
            });
            if(result) {
                DOM.set_text(error_dom, result);
            }
        })

        DOM.add_button(row, "Cancel", null, "form_button", () => {DOM.destroy(container)});
    },

    message: (title, text, isAlert) => {
        let container = DOM.add_div(document.body, null, null, "message_container");
        if(isAlert)
            DOM.add_div(container, title, null, "message_alert");
        else
            DOM.add_div(container, title, null, "message_title");
        DOM.add_div(container, text, null, "message_message");
        setTimeout(() => {
            DOM.destroy(container);
        }, 3000)
    },
}