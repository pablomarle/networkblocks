function post(url, data, callback) {
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => callback(null, data))
    .catch((error) => {
        callback(error)
    });
}

function get(url, callback) {
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => callback(null, data))
    .catch((error) => {
        callback(error)
    });    
}