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
    
    add_element: (e, type, text, id, class_name_list) => {
        let div = document.createElement(type);
        
        if(text)
            DOM.add_text(div, text);
        
        if(id)
            div.id = id;

        if(class_name_list) {
            for(let class_name of class_name_list.split(" "))
                div.classList.add(class_name);
        }

        e.appendChild(div);

        return div;
    },

    add_div: (e, text, id, class_name) => {
        return DOM.add_element(e, "div", text, id, class_name);
    },

    add_link: (e, text, url, id, class_name) => {
        let element = DOM.add_element(e, "a", text, id, class_name);
        element.target = "_blank";
        element.href = url;
        return element;
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

    add_file: (e, name, id, class_name) => {
        let input = DOM.add_element(e, "input", null, id, class_name);
        input.type = "file";

        return input;
    },

    add_textarea: (e, value, id, class_name, placeholder) => {
        let input = DOM.add_element(e, "textarea", null, id, class_name);
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
                        DOM.add_span(td, list_item.name, null, "datatable_listitem");
                    }
                    data[element.name] = element.list;
                }
                else if(element.type === "linklist") {
                    if(!element.hidden) {
                        let td = DOM.add_element(tr, "td");
                        for(let list_item of element.list) {
                            DOM.add_link(td, list_item.name, list_item.url, null, "datatable_link");
                        }
                    }
                    data[element.name] = element.list;
                }
                else if(element.type === "doclist") {
                    if(!element.hidden) {
                        let td = DOM.add_element(tr, "td");
                        for(let doc_id in element.docs) {
                            DOM.add_link(td, element.docs[doc_id].title, `${element.baseurl}/${doc_id}`, null, "datatable_link");
                        }
                    }
                    data[element.name] = element.docs;
                }
                else if(element.type === "actions") {
                    let td = DOM.add_element(tr, "td");
                    td.style.width = "" + (32 * element.actions.length) + "px";
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

    add_form: (form_data, callback, read_only=false) => {
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
                if(read_only)
                    DOM.add_div(row, ""+field_data.value, "ff_field_" + field_name, "form_input_long");
                else
                    form_info[field_name] = DOM.add_input(row, field_data.value, "ff_field_" + field_name, "ff_input");
            }
            else if(field_data.type === "multistring") {
                if(read_only)
                    DOM.add_div(row, field_data.value, "ff_field_" + field_name, "ff_textarea_ro");
                else
                    form_info[field_name] = DOM.add_textarea(row, field_data.value, "ff_field_" + field_name, "ff_textarea");
            }
            else if(field_data.type === "upload") {
                if(!read_only) {
                    form_info[field_name] = DOM.add_file(row, null, null, "ff_input");
                }
            }
            else if(field_data.type === "select") {
                if(read_only)
                    DOM.add_div(row, field_data.options[field_data.value], "ff_field_" + field_name, "form_input_long");
                else
                    form_info[field_name] = DOM.add_select(row, field_data.options, field_data.value, null, "ff_input");
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

                if(!read_only) {
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
                    DOM.add_button(row, "Add", null, null, () => {
                        field_data.value[select.value] = field_data.options[select.value];
                        update_multiselect();
                    });
                }
                update_multiselect();
            }
            else if(field_data.type === "links") {
                row = DOM.add_div(form, null, null, "ff_row");
                let links_container = DOM.add_div(row, null, null, "ff_links");
                if(read_only) {
                    for(let link of field_data.value) {
                        DOM.add_link(links_container, link.name, link.url, null, "form_link");
                    }
                }
                else {
                    let index = 0;

                    let form_info_data = [];
                    form_info[field_name] = form_info_data;
                    let table = DOM.add_element(links_container, "table", null, null, "ff_table");
                    let th = DOM.add_element(table, "thead");
                    let tb = DOM.add_element(table, "tbody");
                    let tf = DOM.add_element(table, "tfoot");

                    // Add head
                    let tr = DOM.add_element(th, "tr");
                    DOM.add_element(tr, "td", "Name");
                    DOM.add_element(tr, "td", "URL");
                    DOM.add_element(tr, "td", "");
                    
                    let add_entry = (link) => {
                        let tr = DOM.add_element(tb, "tr");
                        let td_name = DOM.add_element(tr, "td");
                        let td_url = DOM.add_element(tr, "td");
                        let td_delete = DOM.add_element(tr, "td");
                        let input_name = DOM.add_input(td_name, link.name);
                        let input_url = DOM.add_input(td_url, link.url);
                        let input_delete = DOM.add_button(td_delete, "-", null, null, (ev) => {
                            let subindex = ev.target.getAttribute("data-index");
                            form_info_data[subindex].active = false;
                            DOM.destroy(form_info_data[subindex].tr);
                            console.log(index);
                        });
                        input_delete.setAttribute("data-index", index);
                        form_info[field_name].push({
                            tr: tr,
                            dom_name: input_name,
                            dom_url: input_url,
                            active: true,
                        })
                        index += 1;
                    }

                    // Add footer (new link)
                    let tr_foot = DOM.add_element(th, "tr");
                    let td_f_name = DOM.add_element(tr_foot, "td");
                    let td_f_url = DOM.add_element(tr_foot, "td");
                    let td_f_add = DOM.add_element(tr_foot, "td");
                    let input_f_name = DOM.add_input(td_f_name, "");
                    input_f_name.placeholder = "New link name";
                    let input_f_url = DOM.add_input(td_f_url, "");
                    input_f_url.placeholder = "New link URL";
                    DOM.add_button(td_f_add, "+", null, null, (ev) => {
                        add_entry({
                            name: input_f_name.value,
                            url: input_f_url.value,
                        });
                        input_f_name.value = "";
                        input_f_url.value = "";
                    });

                    // Add body (existing links)
                    for(let link of field_data.value) {
                        add_entry(link);
                    }    
                }
            }
        }

        let row = DOM.add_div(form, null, null, "ff_row");
        if(!read_only) {
            DOM.add_button(row, form_data.submit_label, null, "form_button", () => {
                let data = {};
                for(let field_name in form_info) {
                    let field_data = form_data.fields[field_name];
                    if((field_data.type === "string") || (field_data.type == "select") || (field_data.type === "multistring"))
                        data[field_name] = form_info[field_name].value;
                    else if(field_data.type === "multiselect")
                        data[field_name] = form_info[field_name];
                    else if(field_data.type === "upload")
                        data[field_name] = form_info[field_name].files[0];
                    else if(field_data.type === "links") {
                        data[field_name] = [];
                        for(let entry of form_info[field_name]) {
                            if(entry.active) {
                                data[field_name].push({
                                    name: entry.dom_name.value,
                                    url: entry.dom_url.value,
                                })
                            }
                        }
                    }
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
        }
        DOM.add_button(row, "Close", null, "form_button", () => {DOM.destroy(container)});
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