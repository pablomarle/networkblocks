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
}