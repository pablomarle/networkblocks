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
        return etext;
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

    add_input: (e, value, id, class_name, placeholder) => {
        let input = DOM.add_element(e, "input", null, id, class_name);
        input.value = value;
        if(placeholder)
            input.placeholder = placeholder;

        return input;
    },

    add_button: (e, text, id, class_name, callback) => {
        let button = DOM.add_element(e, "button", text, id, class_name);
        button.addEventListener("click", callback);
        return button;
    },

    add_select: (e, options, value, id, class_name) => {
        let select = DOM.add_element(e, "select", null, id, class_name);
        for(let option_id in options) {
            let option = DOM.add_element(select, "option", options[option_id]);
            option.value = option_id;
        }
        select.value = value;
        return select;
    },

    set_text: (e, text) => {
        DOM.empty(e);
        DOM.add_text(e, text);
    },

    filter_table: (table) => {
        let count_show = 0;
    
        for(let line of table.data) {
            let match = true;
            for(let filter in table.filters) {
                if(table.filters[filter].value != "") {
                    let value_list = [];
                    if(Array.isArray(line.data[filter])) {
                        for(let element of line.data[filter]) {
                            value_list.push(element.name);
                        }
                    }
                    else {
                        value_list = [line.data[filter]];
                    }

                    let submatch = false;
                    for(let value of value_list) {
                        if(value.toLowerCase().indexOf(table.filters[filter].value.toLowerCase()) !== -1) {
                            submatch = true;
                            break;
                        }
                    }
                    if(!submatch)
                        match = false;
                }
            }
            if(!match) {
                line.tr.style.display = "none";
            }
            else {
                if( Math.floor(count_show / table.max_page + 1) === table.current_page)
                    line.tr.style.display = "table-row";
                else
                    line.tr.style.display = "none";
                    count_show++;
            }
        }

        table.count_show = count_show;
    },

    caption_table: (table) => {
        table.dom.caption_text.nodeValue = `${table.caption} (${table.count_show} / ${table.data.length})`;
        table.dom.caption_page.nodeValue = `Page ${table.current_page}`;
    },

    table_pagechange: (table, dir) => {
        if(dir === "+") {
            if( ((table.current_page) * table.max_page) < table.count_show)
                table.current_page++;
        }
        else if(dir === "-") {
            if(table.current_page > 1)
                table.current_page--;
        }

        DOM.filter_table(table);
        DOM.caption_table(table);
    },

    add_table: (e, data, max_page=20) => {
        DOM.empty(e);

        let caption = DOM.add_element(e, "caption");
        let div_page = DOM.add_div(caption, null, null, "datatable_pager");
        let caption_text = DOM.add_text(caption, data.caption);
        let caption_page = DOM.add_text(div_page, "Page 1");

        let thead = DOM.add_element(e, "thead");
        let tbody = DOM.add_element(e, "tbody");
        let tfoot = DOM.add_element(e, "tfoot");

        let tr = DOM.add_element(thead, "tr");

        for(let header of data.head) {
            let td = DOM.add_element(tr, "th", header)
        }

        let result_table = {
            "filters": {},
            max_page: max_page,
            current_page: 1,
            dom: {
                caption_text: caption_text,
                caption_page: caption_page,
                caption: caption,
            },
            caption: data.caption,
        }

        let caption_left = DOM.add_button(div_page, "❮", null, null, () => {DOM.table_pagechange(result_table, "-")});
        let caption_right = DOM.add_button(div_page, "❯", null, null, () => {DOM.table_pagechange(result_table, "+")});

        result_table.data = DOM.add_table_data(tbody, data.body);

        tr = DOM.add_element(tfoot, "tr");
        for(let x = 0; x < data.filters.length; x++) {
            let td = DOM.add_element(tr, "td");
            if(data.filters[x]) {
                let i = DOM.add_input(td, "", null, null, data.filters[x]);
                result_table.filters[data.filters[x]] = i;
                i.addEventListener("keyup", (ev) => {
                    result_table.current_page = 1;
                    DOM.filter_table(result_table);
                    DOM.caption_table(result_table)
                })
            }
        }

        DOM.filter_table(result_table);
        DOM.caption_table(result_table)
    },

    add_table_data: (e, table_data) => {
        DOM.empty(e);

        let result_data = [];

        for(let row of table_data) {
            let data = {};
            let tr = DOM.add_element(e, "tr");
            result_data.push({tr: tr, data: data});

            for(let element of row) {
                if(element.type === "text") {
                    if(!element.hidden) {
                        let td = DOM.add_element(tr, "td");
                        let text = document.createTextNode(element.text);
                        td.appendChild(text);
                    }
                    data[element.name] = element.text;
                }
                else if(element.type === "list") {
                    let td = DOM.add_element(tr, "td");
                    for(let list_item of element.list) {
                        let div = DOM.add_span(td, list_item.name, null, "datatable_listitem");
                        td.appendChild(div);
                    }
                    data[element.name] = element.list;
                }
                else if(element.type === "actions") {
                    let td = DOM.add_element(tr, "td");
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

        return result_data;
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
                form_info[field_name] = field_data.value;
                let ms_container = DOM.add_div(row, null, null, "ff_multiselect");

                let update_multiselect = () => {
                    DOM.empty(ms_container);
                    for(let group_id in field_data.value) {
                        let ms_entry = DOM.add_div(ms_container, field_data.value[group_id], null, "ff_multiselect_entry");
                        ms_entry.setAttribute("data-id", group_id);
                    }
                }

                ms_container.addEventListener("click", (ev) => {
                    if(ev.target.classList.contains("ff_multiselect_entry")) {
                        let group_id = ev.target.getAttribute("data-id");
                        delete field_data.value[group_id];
                        update_multiselect();
                    }
                })

                row = DOM.add_div(form, null, null, "ff_row");
                DOM.add_label(row, field_data.label_add, null, null, "form_label");
                let select = DOM.add_select(row, field_data.options, null, null, "ff_multiselect_select");
                DOM.add_button(row, "Add", null, "form_button", () => {
                    field_data.value[select.value] = field_data.options[select.value];
                    update_multiselect();
                });

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