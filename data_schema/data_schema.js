const DATA_DEFINITION = {
    "document_versions": {
        "data": {
            "document": {"type": "pointer", "object": "documents"},
            "version": {"type": "string", "max_len": 128, "null": false},
            "file": {"type": "file"}
        }
        "custom_data_enabled": false,
        "allowed_actions": ["create"],
    },
    "documents": {
        "data": {
            "name": {"type": "string", "max_len": 128, "null": false},
            "description": {"type": "string_md", "max_len": 2048, "null": false},
        }
        "custom_data_enabled": true,
    },
    "location_type": {
        "data": {
            "name": {"type": "string", "max_len": 128, "null": false},
            "description": {"type": "string_md", "max_len": 2048, "null": false},
        }
        "custom_data_enabled": true,
    },
    "locations": {
        "data": {
            "name": {"label": "Name", "type": "string", "max_len": 128, "null": false},
            "address": {"label": "Address", "type": "string", "max_len": 128, "null": false},
            "zip": {"label": "ZIP", "type": "string", "max_len": 16, "null": false},
            "city": {"label": "City", "type": "string", "max_len": 128, "null": false},
            "state": {"label": "State", "type": "string", "max_len": 128, "null": false},
            "country": {"label": "Country", "type": "string", "max_len": 128, "null": false},
            "description": {"label": "Description", "type": "string_md", "max_len": 2048, "null": false},
            "type": {"label": "Location Type", "type": "pointer", "object": "location_type", "null": true},
            "documents": {"label": "Documents", "type": "list", "list_type": "pointer", "object": "document"},
            "links": {"label": "Links", "type": "list", "list_type": "url"},
        }
        "custom_data_enabled": true,
    }
}
/*
{
    "documents": [
        {
            "uuid": "",
            "name": "",
            "description": "",
            "versions": [
                {
                    "author": "",
                    "timestamp": "",
                    "version": "",
                },
            ],
        }
    ],
    "asset_category": [
        {
            "uuid": "",
            "name": "",
            "description": "",
            "custom_data": [], <- list of uuids of custom data that will be available for an asset
        }
    ],
    "entities": [
        {
            "uuid": "",
            "name": "",
            "description": "",
        }
    ],
    "locations": [
        {
            "uuid": "",
            "name": "",
            "address": "",
            "zip": "",
            "city": "",
            "state": "",
            "country": "",
            "description": "",
            "type": "",
            "custom_data": {},
            "documents": [],   <- List of uuids of documents.
            "docu_links": [], <- List of links
        }
    ],
    "environments": [
        {
            "uuid": "",
            "name": "",
            "description": "",
            "custom_data": {},
            "documents": [],   <- List of uuids of documents.
            "docu_links": [], <- List of links
        }
    ],
    "assets": [
        {
            "uuid": "",
            "sn": "ABC123",
            "vendor": "juniper",
            "model": "aaa",
            "category": "", <- Points to an asset category
            "value": 100,
            "dates": {
                "created": timestamp,
                "retired": timestamp,
            },
            "owner": "",   <- Points to an entity uuid
            "location": "" <- Points to a location uuid
            "custom_data": {},
            "documents": [],   <- List of uuids of documents.
            "docu_links": [], <- List of links
            "inventory": [
                {
                    "sn": "",
                    "vendor": "",
                    "model": "",
                    "type": "power",
                },
                {
                    "sn": "",
                    "vendor": "",
                    "model": "",
                    "type": "card",
                    "inventory": [...],
                },
                {
                    "sn": "",
                    "vendor": "",
                    "model": "",
                    "type": "port",
                    "portinfo": {
                        "name": "Ethernet1",
                        "transceiver": "null or string"
                    }
                }
            ]
        }
    ],
    "devices": [
        {
            "uuid": "",
            "sn": "ABC123",
            "name": "",
            "mgt_ip": "",
            "environment": "",
            "snmp_community": "",

            "custom_data": {},
            "documents": [],   <- List of uuids of documents.
            "docu_links": [], <- List of links
        },
    ],
}
*/