let model_definition = {
    keys: {
// **********************************************************************************************
// Assets
// **********************************************************************************************
        location_category: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                name: { type: "string", unique: true },
                description: { type: "text", default: "" }
            },
            static_entries: {
                "1": {name: "DC", description: "Datacenter"},
                "2": {name: "Office", description: "Office"},
            },
        },
        region: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                name: { type: "name", unique: true},
                description: { type: "text", default: "" },
            },
            initial_entries: {
                "1": {name: "Europe", description: "Europe"},
                "2": {name: "Americas", description: "Americas"},
                "3": {name: "Africa", description: "Africa"},
                "4": {name: "Asia", description: "Asia"},
                "5": {name: "Oceania", description: "Oceania"},
            },
        },
        location: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                name: { type: "name", unique: true},
                code: { type: "name", unique: true},

                description: { type: "text", default: "" },

                address: { type: "string", default: "" },
                city: { type: "string", default: "" },
                state: { type: "string", default: "" },
                country: { type: "string", default: "" },
                zip: { type: "string", default: "" },
                contact_name: { type: "string", default: "" },
                contact_email: { type: "email", default: "" },
                contact_phone: { type: "string", default: "" },
                category: { type: "reference", referenced_key: "location_category", "null": false },
                region: { type: "reference", referenced_key: "region", "null": true },

                documents: { type: "documents" },
                links: {type: "links" }
            }
        },
        vendor: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                name: { type: "name", unique: true},
                description: { type: "text", default: "" },

                contact_name: { type: "string", default: "" },
                contact_email: { type: "email", default: "" },
                contact_phone: { type: "string", default: "" },

                documents: { type: "documents" },
                links: {type: "links" }
            }
        },
        product_category: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                name: { type: "string", unique: true },
                description: { type: "text", default: "" }
            },
            initial_entries: {
                "1": {name: "Server", description: "Server"},
                "2": {name: "Switch", description: "A L2 network device"},
                "3": {name: "Router", description: "A L3 network device"},
                "4": {name: "Laptop/Desktop", description: "Laptop/desktop"},
                "5": {name: "Printer", description: "Printer"},
                "6": {name: "Access Point", description: "Access Point"},
            }
        },
        product: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                name: { type: "name", unique: true},
                part_number: { type: "name", unique: true},

                description: { type: "text", default: "" },

                category: { type: "reference", referenced_key: "product_category", "null": false },
                vendor: { type: "reference", referenced_key: "vendor", "null": false },

                price: { type: "number", default: 0 },
                currency: { type: "reference", referenced_key: "currency" },

                documents: { type: "documents" },
                links: {type: "links" }
            }
        },
        currency: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                name: { type: "name", unique: true},
                code: { type: "name", unique: true},
                relative_value: { type: "number", default: 1}
            },
            static_entries: {
                "1": {name: "US Dollar", code: "USD", relative_value: 1},
                "2": {name: "Euro", code: "EUR", relative_value: 1.18},
                "3": {name: "Pound Sterling", code: "GBP", relative_value: 1.37},
            }
        },
        team: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                name: { type: "name", unique: true },
                description: { type: "text", default: "" },
                email: { type: "email", default: "" },

                documents: { type: "documents"},
                links: {type: "links" }
            },
        },
        purchase_order_status: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                name: { type: "name", unique: true },
                description: { type: "text", default: "" },
            },
            static_entries: {
                "1": {name: "New", description: "New purchas order"},
                "2": {name: "Released", description: "Purchase order has been sent to the vendor"},
                "3": {name: "Received", description: "All items of the purchase order have been received"},
                "4": {name: "Canceled", description: "Purchase order is no longer valid"},
            },
        },
        purchase_order: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                code: { type: "name", unique: true },
                description: { type: "text", default: "" },
                team: {type: "reference", referenced_key: "team", null: true},
                status: {type: "reference", referenced_key: "purchase_order_status", default: "1"},

                documents: { type: "documents"},
                links: {type: "links" }
            },
        },
        rack: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                name: { type: "string", default: "" },
                height: { type: "number", default: 42 },
                location: { type: "reference", referenced_key: "location", "null": false },
                coord_x: { type: "number", default: 0 },
                coord_y: { type: "number", default: 0 },
                coord_z: { type: "number", default: 0 },
                links: {type: "links" },
            }
        },
        asset: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                serial_number: { type: "name", unique: true},
                mac_address: { type: "mac_address", default: "00:00:00:00:00:00" },

                product: { type: "reference", referenced_key: "product", "null": false },
                location: { type: "reference", referenced_key: "location", "null": true },
                owner: {type: "reference", referenced_key: "team", null: true},                

                purchase_order: { type: "reference", referenced_key: "purchase_order", "null": true },
                value: { type: "number", "default": 0 },
                currency: { type: "reference", referenced_key: "currency" },
                device: { type: "reference", referenced_key: "device", "null": true },
                rack: { type: "reference", referenced_key: "rack", null: true },
                rack_u: {type: "number", default: 0},

                links: {type: "links" }
            },
            post_processing: [
                // Function to fix location if rack is defined
                (db, id, create_reverse_reference, remove_reverse_reference) => {
                    let entry = db.keys.asset[id];
                    if(entry.fields.rack !== "") {
                        if(entry.fields.location != db.keys.rack[entry.fields.rack].fields.location) {
                            remove_reverse_reference("asset", id, "location", "location", entry.fields.location);
                            entry.fields.location = db.keys.rack[entry.fields.rack].fields.location;
                            create_reverse_reference("asset", id, "location", "location", entry.fields.location);
                        }
                    }
                },
            ],
        },

// **********************************************************************************************
// Devices
// **********************************************************************************************
        environment: {
            permissions: {
                ro: ["devices_ro", "devices_rw"],
                rw: ["devices_rw"]
            },
            fields: {
                name: { type: "name", unique: true },
                description: { type: "text", default: "" },
                documents: { type: "documents"},
                links: {type: "links" }
            },
        },
        device_function: {
            permissions: {
                ro: ["devices_ro", "devices_rw"],
                rw: ["devices_rw"]
            },
            fields: {
                name: { type: "name", unique: true },
                description: { type: "text", default: "" },
                documents: { type: "documents"},
                links: {type: "links" }
            },
        },
        os: {
            permissions: {
                ro: ["devices_ro", "devices_rw"],
                rw: ["devices_rw"]
            },
            fields: {
                name: { type: "name", unique: true },
                description: { type: "text", default: "" },
                documents: { type: "documents"},
                links: {type: "links" }
            },
        },
        os_version: {
            permissions: {
                ro: ["devices_ro", "devices_rw"],
                rw: ["devices_rw"]
            },
            fields: {
                version: { type: "name", unique: true },
                description: { type: "text", default: "" },
                os: { type: "reference", referenced_key: "os", "null": false },
                documents: { type: "documents"},
                links: {type: "links" }
            },
        },
        device_status: {
            permissions: {
                ro: ["devices_ro", "devices_rw"],
                rw: ["devices_rw"]
            },
            fields: {
                name: { type: "name", unique: true },
                description: { type: "text", default: "" },
            },
            static_entries: {
                "1": { name: "Provisioning", description: "Device is being provisioned."},
                "2": { name: "In use", description: "Device is live."},
                "3": { name: "Maintenance", description: "Device is under maintenance."},
                "4": { name: "Deprovisioning", description: "Device is being deprovisioned."},
            },
        },
        device: {
            permissions: {
                ro: ["devices_ro", "devices_rw"],
                rw: ["devices_rw"]
            },
            fields: {
                name: { type: "name", unique: true },
                mgmt_ip: { type: "ip", unique: true },
                owner: {type: "reference", referenced_key: "team", null: false},
                environment: {type: "reference", referenced_key: "environment", null: false},
                function: {type: "reference", referenced_key: "device_function", null: false},
                os_version: {type: "reference", referenced_key: "os_version", null: false},
                status: {type: "reference", referenced_key: "device_status", null: false},
                links: {type: "links" }
            }
        },
// **********************************************************************************************
// IPAM
// **********************************************************************************************
        ipam_function: {
            permissions: {
                ro: ["ipam_ro", "ipam_rw"],
                rw: ["ipam_rw"]
            },
            fields: {
                name: { type: "name", unique: true },
                description: { type: "text", default: "" },
                documents: { type: "documents"},
                links: {type: "links" }
            },
        },
        network: {
            permissions: {
                ro: ["ipam_ro", "ipam_rw"],
                rw: ["ipam_rw"]
            },
            fields: {
                address: { type: "ipnetwork", unique: true },
                description: { type: "text", default: "" },

                owner: {type: "reference", referenced_key: "team", null: true },
                environment: {type: "reference", referenced_key: "environment", null: true },
                function: {type: "reference", referenced_key: "ipam_function", null: true },
                location: { type: "reference", referenced_key: "location", "null": true },
            }
        },

    }
}

module.exports = model_definition;