function prefix2mask(p, v) {
    let poslength;
    let mask;

    if(v == 4) {
        poslength = 8;
        mask = [0,0,0,0];
    }
    else if(v == 6) {
        poslength = 16;
        mask = [0,0,0,0,0,0,0,0];
    }
    else
        return null;

    let index = 0;
    let maskfull = Math.pow(2, poslength) - 1;

    while(p >= poslength) {
        p -= poslength;
        mask[index] = maskfull;
        index ++;
    }

    if(p != 0)
        mask[index] = (maskfull << (poslength - p) & maskfull);

    return mask;
}

function networkOfAddress(ip, mask) {
    let network_address = [];
    for(let i = 0; i < ip.length; i++)
        network_address.push(ip[i] & mask[i]);

    return network_address;
}

function areIpEqual(ip1, ip2) {
    if(ip1.length != ip2.length) return false;

    for(let x = 0; x < ip1.length; x++) {
        if(ip1[x] !== ip2[x]) return false;
    }

    return true;
}

function isSubnet(subnet, net) {
    if(subnet.v !== net.v) return false;

    let subnet_net = networkOfAddress(subnet.ip, net.mask);
    
    return ((areIpEqual(subnet_net, net.ip)) && (subnet.prefix > net.prefix))
}

function isNetworkEqual(net1, net2) {
    if(subnet.v !== net.v) return false;

    if(areIpEqual(net1.ip, net2.ip) && (net1.prefix === net2.prefix))
        return true;

    return false;
}

function createIpNetwork(e) {
    if(typeof e !== "string")
        return null;

    let e_split = e.split("/");
    if(e_split.length != 2)
        return null;

    let ip = createIpAddress(e_split[0]);
    if(!ip)
        return null;

    if(isNaN(e_split[1]))
        return null;

    let prefix = parseInt(e_split[1]);

    if(ip.v === 4) {
        if((prefix < 0) || (prefix > 32))
            return null;
    }
    else if(ip.v === 6) {
        if((prefix < 0) || (prefix > 128))
            return null;
    }
    else {
        return null;
    }

    ip.prefix = prefix;

    // Convert address to a network address
    ip.mask = prefix2mask(prefix, ip.v);
    ip.ip = networkOfAddress(ip.ip, ip.mask);

    return ip;
}

function createIpAddress(e) {
    if(typeof e !== "string")
        return null;

    // Validate IPv4
    let e_split = e.split(".");
    if(e_split.length === 4) {
        let ip = [];
        for(let x = 0; x < 4; x++) {
            if( (!isNaN(e_split[x]))) {
                let n = parseInt(e_split[x])
                if((n >= 0) && (n < 256)) {
                    ip.push(n);
                }
                else {
                    return null;
                }
            }
            else {
                return null;
            }
        }
        return {v: 4, ip: ip}
    }
    
    // Validate IPv6
    if(e.startsWith("::"))
        e = "0" + e;
    if(e.endsWith("::"))
        e = e + "0";
    e_split = e.split(":");
    if(e_split.length <= 8) {
        let ip = [];
        let separator = -1;
        for(let x = 0; x < e_split.length; x++) {
            e_split[x] = "0x" + e_split[x];
            if( (!isNaN(e_split[x]))) {
                let n = parseInt(e_split[x])
                if((n >= 0) && (n < 65536)) {
                    ip.push(n);
                }
                else {
                    console.log("A")
                    return null;
                }
            }
            else if( (e_split[x] === "0x") && (separator === -1)) {
                separator = x;
            }
            else {
                return null;
            }
        }

        if((ip.length !== 8) && (separator === -1)) {
            console.log("C")
            return null;
        }
        else if(separator !== -1) {
            while(ip.length != 8)
                ip.splice(separator, 0, 0);
        }

        return {v: 6, ip: ip};
    }

    return null;
}

function ipAddressToLongString(ip) {
    if(ip.v === 4)
        return ip.ip.join(".");
    else if(ip.v === 6) {
        let result_list = [];
        for(let n of ip.ip)
            result_list.push(n.toString(16))

        return result_list.join(":")
    }
}

function ipNetworkToLongString(network) {
    return `${ ipAddressToLongString(network) }/${ network.prefix }`;
}

module.exports = {
    network: {
        create: createIpNetwork,
        isSubnet: isSubnet,
        isEqual: isNetworkEqual,
        toLongString: ipNetworkToLongString,
    },
    address: {
        create: createIpAddress,
        toLongString: ipAddressToLongString,
    }
}