function main()
{
    document.getElementById("login").addEventListener("click", () => {
        let data = {
            username: document.getElementById("username").value,
            password: document.getElementById("password").value,
        }
        fetch("/api/users/login", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {
            if("error" in data)
                DOM.set_text(document.getElementById("id_message"), data["error"]);
            else
                location.href = "/";
        })
        .catch(error => DOM.set_text(document.getElementById("id_message"), "Error connecting to server."));

    })
}