const nodemailer = require("nodemailer");

let transport, from, only_log;

function initialize(config) {
    from = config.smtp.from;
    only_log = config.smtp.only_log;

    if(!only_log) {
        transport = nodemailer.createTransport({
            host: config.smtp.server,
            port: config.smtp.port,
            secure: config.smtp.is_secured,
            tls: {rejectUnauthorized: config.smtp.verify_ssl_cert},
            auth: {
                user: config.smtp.user,
                pass: config.smtp.password
            }
        });
    }
}

async function send_email(to, subject, text, html) {
    if(only_log) {
        console.log("\n**********************************************************")
        console.log(`Simulated email from ${from} to ${to}`)
        console.log("**********************************************************")
        console.log(subject);
        console.log(text);
        console.log("**********************************************************/n")
    }
    else {
        let message = {
            "from": from,
            "to": to,
            "subject": subject,
            "text": text
        }
        if(html != null)
            message.html = html;
        await transport.sendMail(message);
    }
}

module.exports = {
    initialize: initialize,
    send_email: send_email,
}