let locations = null;
let options_location = null;

function show_edit_form(data, read_only = false) {
    let title = `Edit ${data.name}`;
    if(read_only)
        title = data.name;

    DOM.add_form({
        title: title,
        submit_label: "Update",
        fields: {
            name: {type: "string", label: "Name", value: data.name},
            height: {type: "string", label: "Height (in Us)", value: data.height},
            location: {type: "select", label: "Location", options: options_location, value: data.location},
            coord_x: {type: "string", label: "Coord X", value: data.coord_x},
            coord_z: {type: "string", label: "Coord Z", value: data.coord_z},
            links: {type: "links", label: "Links", value: data.links},
        }
}, (form_result, update_form) => {
        REQUESTS.post(`/api/db/rack/${data.id}`, {fields: {
            name: form_result.name,
            height: parseFloat(form_result.height),
            location: form_result.location,
            coord_x: parseFloat(form_result.coord_x),
            coord_z: parseFloat(form_result.coord_z),
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
                DOM.message("Rack Updated", `Rack ${data.name} updated`);
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
        REQUESTS.delete(`/api/db/rack/${data.id}`, {}, (err, post_result) => {
            if(err) {
                update_form(err);
            }
            else if("error" in post_result)
                update_form(post_result.error)
            else {
                update_form();
                load_datatable();
                DOM.message("Rack deleted", `Rack ${data["name"]} deleted.`);
            }
        })
    })
}

function show_view_form(data) {
    show_edit_form(data, true);
}

function load_datatable() {
    REQUESTS.get("/api/db/rack", (err, result) => {
        if(err) {
            DOM.message("Error getting Racks", err, true);
            return;
        }
        else if("error" in result) {
            DOM.message("Error getting Racks", result["error"], true);
            return;
        }

        let table_data = [];
        for(let id in result) {
            let row_data = [
                {type: "text", text: id, name: "id", hidden: true},
                {type: "text", text: result[id].fields.name, name: "name"},
                {type: "text", text: result[id].fields.height, name: "height", hidden: false},
                {type: "text", text: options_location[result[id].fields.location], name: "location_name", hidden: false},
                {type: "text", text: result[id].fields.location, name: "location", hidden: true},
                {type: "text", text: result[id].fields.coord_x, name: "coord_x", hidden: false},
                {type: "text", text: result[id].fields.coord_y, name: "coord_y", hidden: true},
                {type: "text", text: result[id].fields.coord_z, name: "coord_z", hidden: false},
                {type: "linklist", name: "links", list: result[id].fields.links},
                {type: "actions", actions: [
                    {label: "🔍", description: "View", action: show_view_form },
                    {label: "🖋️", description: "Edit", action: show_edit_form },
                    {label: "☠️", description: "Delete", action: show_delete_form },
                ]},
            ];
            table_data.push(row_data);
        }

        let table = {
            caption: "List of Racks",
            head: ["Name", "Height", "Location", "Coord X", "Coord Z", "Links", "Actions"],
            body: table_data,
            filters: [ "name", "height", "location_name"],
        }

        //DOM.add_table_data(DOM.get_id("usertable_body"), table_data);
        DOM.add_table(DOM.get_id("locationtable"), table);
    });
}

function load_locations() {
    REQUESTS.get("/api/db/location", (err, result) => {
        if(err) {
            DOM.message("Error", `Error loading locations: ${err}`);
        }
        else if("error" in result)
            DOM.message("Error", `Error loading locations: ${result.error}`);

        locations = result;
        options_location = {};
        for(let location_id in locations)
            options_location[location_id] = locations[location_id].fields.name;

        if(locations) {
            load_datatable();
        }
    });
}

function main() {
    DOM.get_id("menu_rack").style.fontWeight = "bold";

    load_locations();

    let new_button = DOM.get_id("new_element");

    DOM.add_text(new_button, "New Rack");
    new_button.addEventListener("click", () => {
        DOM.add_form({
            title: "New Rack",
            submit_label: "Create",
            fields: {
                name: {type: "string", label: "Name", value: ""},
                height: {type: "string", label: "Height (in Us)", value: "42"},
                location: {type: "select", label: "Location", options: options_location, value: ""},
                coord_x: {type: "string", label: "Coord X", value: "0"},
                coord_z: {type: "string", label: "Coord Z", value: "0"},
                links: {type: "links", label: "Links", value: []},
            }
        }, (form_result, update_form) => {
            if(isNaN(form_result.height) || (form_result.height <= 0) || (!Number.isInteger(parseFloat(form_result.height)))) {
                update_form("Height must be a positive integer.");
                return;
            }
            if(isNaN(form_result.coord_x) || isNaN(form_result.coord_z)) {
                update_form("Coordinates must be a number.");
                return;
            }

            REQUESTS.post("/api/db/rack", {
                name: form_result.name,
                height: parseFloat(form_result.height),
                location: form_result.location,
                coord_x: parseFloat(form_result.coord_x),
                coord_z: parseFloat(form_result.coord_z),
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
                    DOM.message("New Location", "New rack created successfully.");
                }
            })
        })
    })
}