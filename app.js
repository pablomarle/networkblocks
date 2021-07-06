const express = require('express')
const expressHandlebars = require('express-handlebars')
const cookieParser = require('cookie-parser')
const user = require('./user')

let data = {
    app: null,
    config: null,
}

function authentication_middleware(req, res, next) {
    if(req.session.user || (req.path === "/api/users/login")) {
        return next();
    }
    else if(req.path.startsWith("/api/")) {
        return res.status(401).json({"error": "Not logged in."});
    }
    else {
        if(
            (req.path === "/login")
            || (req.path.startsWith("/static/"))
            ) {
            return next();
        }
        else {
            return res.redirect("/login");
        }
    }
}

function setup_routes() {
    data.app.use(authentication_middleware);

    data.app.get('/', (req, res) => res.render("main", {
        title: "NetworkMaps Manager",
        custom_js: ["main.js"],
        session: user.get_session_data(req), 
    }));
    data.app.get('/login', (req, res) => res.render("login", {
        title: "NetworkMaps Manager",
        custom_js: ["dom.js", "login.js"],
        disable_menu: true
    }));

    data.app.get('/profile', (req, res) => res.render("profile", {
        title: "NetworkMaps - Profile",
        custom_js: ["dom.js", "tools.js", "profile.js"],
        session: user.get_session_data(req),
    }));

    data.app.get('/logout', (req, res) => {
        let result = user.logout(req.session_id);
        res.redirect("/");
    });

    data.app.get('/admin/users', (req, res) => res.render("users", {
        title: "NetworkMaps Users",
        custom_js: ["dom.js", "tools.js", "users.js"],
        session: user.get_session_data(req),
    }));

    user.setup_routes(data.app);
}

function setup_error_handling() {
    // custom 404 page
    data.app.use((req, res) => {
        res.status(404);
        res.render('404');
    })

    // custom 500 page
    data.app.use((err, req, res, next) => {
        console.error(err.message);
        res.status(500);
        res.render('500');
    })
}

function start_app(config) {
    data.config = config;
    user.initialize(config);

    data.app = express()

    data.app.disable('x-powered-by');

    // configure Handlebars view engine
    data.app.engine('handlebars', expressHandlebars({}))
    data.app.set('view engine', 'handlebars')

    // Configure cookies and sessions
    data.app.use(cookieParser(config.cookie_secret));
    data.app.use(user.nm_session_middleware);

    // Body parser
    data.app.use(express.json());

    // Static content
    data.app.use(express.static(__dirname + '/public'))

    // Setup all routing
    setup_routes();
    setup_error_handling();

    data.app.listen(config.socket.port, () => console.log(
      `Express started on http://localhost:${config.socket.port}; ` +
      `press Ctrl-C to terminate.`));
}

module.exports = {
    start_app: start_app,
}