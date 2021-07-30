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
        asset: {
            permissions: {
                ro: ["assets_ro", "assets_rw"],
                rw: ["assets_rw"]
            },
            fields: {
                serial_number: { type: "name", unique: true},
                mac_address: { type: "mac_address", default: "00:00:00:00:00:00" },

                product: { type: "reference", referenced_key: "product", "null": false },
                location: { type: "reference", referenced_key: "location", "null": false },
                owner: {type: "reference", referenced_key: "team", null: true},                

                purchase_order: { type: "reference", referenced_key: "purchase_order", "null": true },
                value: { type: "number", "default": 0 },
                currency: { type: "reference", referenced_key: "currency" },

                documents: { type: "documents"},
                links: {type: "links" }
            }
        },
    }
}

module.exports = model_definition;