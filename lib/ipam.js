const IP = require('./ip');
const tools = require('./tools')

let ipam_tree = [];

function create_entry(network, id, data) {
    return {
        network: network,
        id: id,
        data: data,
        subnetworks: [],
    }
}

function add_network_to_tree(tree, network, id, data) {
    for(let element of tree) {
        if(IP.network.isSubnet(network, element.network)) {
            add_network_to_tree(element.subnetworks, network, id, data);
            return;
        }
    }

    let new_entry = create_entry(network, id, data);

    // Check if networks on this tree are subnetworks of the new one.
    // If so, move them behind the new network.
    for(let x = 0; x < tree.length; x++) {
        if(IP.network.isSubnet(tree[x].network, network)) {
            new_entry.subnetworks.push(tree[x]);
            tree.splice(x, 1);
            x--;
        }
    }

    tree.push(new_entry);
}

function initialize(db) {
    tools.log("ipam", "Initializing.")

    // Create a tree of ips
    for(let id in db.keys.network) {
        let network = IP.network.create(db.keys.network[id].fields.address);
        let data = db.keys.network[id];

        add_network_to_tree(ipam_tree, network, id, data);

        for(let tree_element of ipam_tree) {

        }
    }

    tools.log("ipam", "Initialized.")
    // console.log(JSON.stringify(ipam_tree, null, 4));
}

function delete_id(tree, id, network) {
    for(let x = 0; x < tree.length; x++) {
        let element = tree[x]
        if(element.id === id) {
            let old_subnets = element.subnetworks;
            tree.splice(x, 1);
            tree.push(...old_subnets);
            return true;
        }
        // If we have the network, we can go straight to the right list of subnets. If not,
        // we will have to run through all of them
        if(network) {
            if(IP.network.isSubnet(network, element.network)) {
                return delete_id(element.subnetworks, id, network);
            }
        }
        else {
            if(delete_id(element.subnetworks, id, network))
                return True;
        }
    }

    return false;
}

function post_processor(action, key, id, element, old_element) {
    if(action === "new") {
        let network = IP.network.create(element.fields.address);
        add_network_to_tree(ipam_tree, network, id, element);

        // console.log(JSON.stringify(ipam_tree, null, 4));
    }
    else if(action === "delete") {
        let network = IP.network.create(element.fields.address);
        delete_id(ipam_tree, id, network); 
    }
    else if(action === "update") {
        if(old_element.fields.address !== element.fields.address) {
            let network = IP.network.create(old_element.fields.address);
            delete_id(ipam_tree, id, network);

            network = IP.network.create(element.fields.address);
            add_network_to_tree(ipam_tree, network, id, element);
        }
    }
}

module.exports = {
    post_processor: post_processor,
    initialize: initialize,
    ipam_tree: ipam_tree,
}