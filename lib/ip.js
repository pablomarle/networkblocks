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
                    return null;
                }
            }
            else if( (e_split[x] === "0x") && (separator === -1)) {
                separator = x;
            }
            else {
                console.log(e_split)
                console.log(x)
                return null;
            }
        }

        if((ip.length !== 8) && (separator === -1)) {
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
    else if(ip.v === 6)
        return ip.ip.join(":");
}

module.exports = {
    address: {
        create: createIpAddress,
        toLongString: ipAddressToLongString,
    }
}