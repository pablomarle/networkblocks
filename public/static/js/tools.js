const REQUESTS = {
    post: (url, data, callback) => {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if(response.status === 500)
                callback("Internal Server Error");
            else
                return response.json();
        })
        .then(data => { if(data) callback(null, data) })
        .catch((error) => {
            callback(error)
        });
    },

    delete: (url, data, callback) => {
        fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if(response.status === 500)
                callback("Internal Server Error");
            else
                return response.json();
        })
        .then(data => { if(data) callback(null, data) })
        .catch((error) => {
            callback(error)
        });
    },

    get: (url, callback) => {
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if(response.status === 500)
                callback("Internal Server Error");
            else
                return response.json();
        })
        .then(data => { if(data) callback(null, data) })
        .catch((error) => {
            callback(error)
        });    
    },

    upload: (url, formdata, callback) => {
        fetch(url, {
            method: "POST",
            body: formdata,
        })
        .then(response => {
            if(response.status === 500)
                callback("Internal Server Error");
            else
                return response.json();
        })
        .then(data => { if(data) callback(null, data) })
        .catch((error) => {
            callback(error)
        });    
    }
}

function timestamp_datestring(timestamp) {
    return new Date(timestamp).toLocaleString();
}

function add_doc_management(key, element_id, field, docs, doc_id) {
    let doc = docs[doc_id];
    let container = DOM.add_div(document.body, null, null, "ff_container");
    let form = DOM.add_div(container, null, null, "ff_form");
    let title = DOM.add_div(form, doc.title, null, "ff_title");
    let close = DOM.add_div(title, "x", null, "ff_close");
    close.addEventListener("click", () => {
        DOM.destroy(container);
    });

    let error_dom = DOM.add_div(form, null, null, "ff_row_error");

    let row = DOM.add_div(form, null, null, "ff_row");
    let version_table = DOM.add_element(row, "table", null, null, "datatable");

    let table_data = [];
    for(let version_index = doc.versions.length-1; version_index >= 0; version_index--) {
        let version = doc.versions[version_index];
        table_data.push([
            {type: "text", text: ""+version_index, name:"index"},
            {type: "text", text: version.created_by, name:"created_by"},
            {type: "text", text: timestamp_datestring(version.created), name:"created"},
            {type: "actions", actions: [
                {label: "⬇", description: "View", action: (data) => {
                    window.open(`/api/db/${key}/${element_id}/download/${field}/${doc_id}/${data.index}`)
                } },
            ]},
        ]);
    }
    let table = {
        caption: "Document Versions",
        head: ["Version", "Author", "Date", "Actions"],
        body: table_data,
        filters: [],
    }

    DOM.add_table(version_table, table);
}

function add_docs_management(key, element_id, field, docs, update_function) {
    let container = DOM.add_div(document.body, null, null, "ff_container");
    let form = DOM.add_div(container, null, null, "ff_form");
    let title = DOM.add_div(form, "Documents", null, "ff_title");

    let close = DOM.add_div(title, "x", null, "ff_close");
    close.addEventListener("click", () => {
        DOM.destroy(container);
    });

    let error_dom = DOM.add_div(form, null, null, "ff_row_error");

    let row = DOM.add_div(form, null, null, "ff_row");
    let docs_table = DOM.add_element(row, "table", null, null, "datatable");
    
    let table_data = [];
    for(let doc_id in docs) {
        let doc = docs[doc_id];
        table_data.push([
            {type: "text", text: doc_id, name:"id", hidden: true},
            {type: "text", text: doc.title, name: "title"},
            {type: "text", text: doc.description, name:"description"},
            {type: "text", text: doc.created_by, name:"created_by"},
            {type: "actions", actions: [
                {label: "🔍", description: "Edit", action: (data) => { doc_edit(key, element_id, field, docs, data.id, update_function) } },
                {label: "⬇", description: "Download", action: (data) => { window.open(`/api/db/${key}/${element_id}/download/${field}/${data.id}`) } },
                {label: "⬆", description: "Upload", action: (data) => { doc_version(key, element_id, field, docs, data.id, update_function) } },
                {label: "📁", description: "Versions", action: (data) => { add_doc_management(key, element_id, field, docs, data.id) } },
                {label: "☠️", description: "Delete", action: (data) => { doc_delete(key, element_id, field, docs, data.id, update_function) } },
            ]},
        ]);
    }
    let table = {
        caption: "Documents",
        head: ["Name", "Description", "Author", "Actions"],
        body: table_data,
        filters: [],
    }

    DOM.add_table(docs_table, table);

    row = DOM.add_div(form, null, null, "ff_row");
    DOM.add_button(row, "New Document", null, "form_button", () => {
        doc_new(key, element_id, field, docs, update_function);
    });

    return container;
}

function doc_new(key, element_id, field, docs, update_function) {
    DOM.add_form({
        title: `New ${field}.`,
        submit_label: "New",
        fields: {
            title: {type: "string", label: "Title", value: ""},
            description: {type: "multistring", label: "Description", value: ""},
            upload: {type: "upload", label: "Document"},
        }
    }, (form_result, update_form) => {
        let formdata = new FormData();
        formdata.append("upload", form_result.upload);
        formdata.append("title", form_result.title);
        formdata.append("description", form_result.description);

        REQUESTS.upload(`/api/db/${key}/${element_id}/upload/${field}`, formdata, 
        (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                DOM.message("Document Created", `Document created.`);
                docs[post_result.id] = post_result.data;
                update_form();
                update_function();
                console.log(docs);
            }
        })
    });
}

function doc_edit(key, element_id, field, docs, doc_id, update_function) {
    DOM.add_form({
        title: `Edit ${docs[doc_id].title}`,
        submit_label: "Update",
        fields: {
            title: {type: "string", label: "Title", value: docs[doc_id].title},
            description: {type: "multistring", label: "Description", value: docs[doc_id].description},
        }
    }, (form_result, update_form) => {
        REQUESTS.post(`/api/db/${key}/${element_id}/upload/${field}/${doc_id}`, {
            title: form_result.title,
            description: form_result.description,            
        }, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                DOM.message("Document Updated", `Document updated.`);
                docs[doc_id].title = form_result.title; 
                docs[doc_id].description = form_result.description; 
                update_form();
                update_function();
            }
        })
    });
}

function doc_delete(key, element_id, field, docs, doc_id, update_function) {
    DOM.add_form({
        title: `Delete ${docs[doc_id].title}?`,
        submit_label: "Delete",
        fields: {},
    }, (form_result, update_form) => {
        REQUESTS.delete(`/api/db/${key}/${element_id}/upload/${field}/${doc_id}`, {
        }, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                DOM.message("Document Updated", `Document updated.`);
                delete docs[doc_id];
                update_form();
                update_function();
            }
        });

    })
}

function doc_version(key, element_id, field, docs, doc_id, update_function) {
    DOM.add_form({
        title: `Upload ${docs[doc_id].title}?`,
        submit_label: "Upload",
        fields: {
            upload: {type: "upload", label: "Document"},
        },
    }, (form_result, update_form) => {
        let formdata = new FormData();
        formdata.append("upload", form_result.upload);

        REQUESTS.upload(`/api/db/${key}/${element_id}/upload/${field}/${doc_id}/version`, formdata,
        (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                DOM.message("Document Updated", `Document updated.`);
                docs[doc_id].versions.push(post_result.data);
                update_form();
                update_function();
            }
        });

    })
}

function load_option(options, key, callback) {
    REQUESTS.get(`/api/db/${key}`, (err, result) => {
        if(err) {
            DOM.message("Error", `Error loading ${key}: ${err}`);
        }
        else if("error" in result)
            DOM.message("Error", `Error loading ${key}: ${result.error}`);

        options[key].data = {};
        options[key].full_data = {};
        for(let id in result) {
            options[key].data[id] = result[id].fields[options[key].field];
            options[key].full_data[id] = result[id];
        }

        if(options[key].null_allowed)
            options[key].data[""] = "N/A";

        for(let key in options) {
            if(options[key].data === null)
                return;
        }

        callback();
    });
}

function load_options(options, callback) {
    if(Object.keys(options).length === 0) {
        callback();
        return;
    }

    for(let key in options) {
        load_option(options, key, callback);
    }
}

