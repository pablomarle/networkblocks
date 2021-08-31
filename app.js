const express = require('express')
const expressHandlebars = require('express-handlebars')
const cookieParser = require('cookie-parser')
const user = require('./lib/user')
const webdb = require('./lib/webdb')
const tools = require('./lib/tools')

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

function logging_middleware(req, res, next) {
    let username = "anonymous";
    let session_data = user.get_session_data(req);
    if(session_data && session_data.user)
        username = session_data.user;

    tools.log("Request", `${req.ip} ${req.session_id} ${username} ${req.method} ${req.path}`);
    next();
}

function setup_routes() {
    data.app.use(authentication_middleware);
    data.app.use(logging_middleware);

    // USER URLS
    data.app.get('/', (req, res) => res.render("main", {
        title: "NetworkBlocks Manager",
        custom_js: ["main.js"],
        session: user.get_session_data(req), 
    }));

    data.app.get('/login', (req, res) => res.render("login", {
        title: "NetworkBlocks Manager",
        custom_js: ["dom.js", "login.js"],
        disable_menu: true
    }));

    data.app.get('/profile', (req, res) => res.render("profile", {
        title: "NetworkBlocks - Profile",
        custom_js: ["dom.js", "tools.js", "profile.js"],
        session: user.get_session_data(req),
    }));

    data.app.get('/logout', (req, res) => {
        let result = user.logout(req.session_id);
        res.redirect("/");
    });

    data.app.get('/admin/users', (req, res) => res.render("users", {
        title: "NetworkBlocks Users",
        custom_js: ["dom.js", "tools.js", "users.js"],
        session: user.get_session_data(req),
    }));

    data.app.get('/admin/groups', (req, res) => res.render("users", {
        title: "NetworkBlocks Groups",
        custom_js: ["dom.js", "tools.js", "groups.js"],
        session: user.get_session_data(req),
    }));

    // ASSET URLS
    data.app.get('/location/region', (req, res) => res.render("asset", {
        title: "NetworkBlocks Region",
        custom_js: ["dom.js", "tools.js", "asset/location_region.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/location/category', (req, res) => res.render("asset", {
        title: "NetworkBlocks Location",
        custom_js: ["dom.js", "tools.js", "asset/location_category.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/location', (req, res) => res.render("asset", {
        title: "NetworkBlocks Location",
        custom_js: ["dom.js", "tools.js", "asset/location.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/vendor', (req, res) => res.render("asset", {
        title: "NetworkBlocks Vendor",
        custom_js: ["dom.js", "tools.js", "asset/vendor.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/product/category', (req, res) => res.render("asset", {
        title: "NetworkBlocks Product Category",
        custom_js: ["dom.js", "tools.js", "asset/product_category.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/product', (req, res) => res.render("asset", {
        title: "NetworkBlocks Product",
        custom_js: ["dom.js", "tools.js", "asset/product.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/team', (req, res) => res.render("asset", {
        title: "NetworkBlocks Teams",
        custom_js: ["dom.js", "tools.js", "asset/team.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/currency', (req, res) => res.render("asset", {
        title: "NetworkBlocks Currencies",
        custom_js: ["dom.js", "tools.js", "asset/currency.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/po/status', (req, res) => res.render("asset", {
        title: "NetworkBlocks PO Status",
        custom_js: ["dom.js", "tools.js", "asset/po_status.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/po', (req, res) => res.render("asset", {
        title: "NetworkBlocks PO",
        custom_js: ["dom.js", "tools.js", "asset/po.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/rack', (req, res) => res.render("asset", {
        title: "NetworkBlocks Rack",
        custom_js: ["dom.js", "tools.js", "asset/rack.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/asset', (req, res) => res.render("asset", {
        title: "NetworkBlocks Asset",
        custom_js: ["dom.js", "tools.js", "asset/asset.js"],
        session: user.get_session_data(req),
    }));

    // DEVICE URLS
    data.app.get('/device', (req, res) => res.render("device", {
        title: "NetworkBlocks Device",
        custom_js: ["dom.js", "tools.js", "device/device.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/device_status', (req, res) => res.render("device", {
        title: "NetworkBlocks Device Status",
        custom_js: ["dom.js", "tools.js", "device/device_status.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/environment', (req, res) => res.render("device", {
        title: "NetworkBlocks Environments",
        custom_js: ["dom.js", "tools.js", "device/environment.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/device_function', (req, res) => res.render("device", {
        title: "NetworkBlocks Device Function",
        custom_js: ["dom.js", "tools.js", "device/device_function.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/os', (req, res) => res.render("device", {
        title: "NetworkBlocks OS",
        custom_js: ["dom.js", "tools.js", "device/os.js"],
        session: user.get_session_data(req),
    }));
    data.app.get('/os_version', (req, res) => res.render("device", {
        title: "NetworkBlocks OS Version",
        custom_js: ["dom.js", "tools.js", "device/os_version.js"],
        session: user.get_session_data(req),
    }));

    // IPAM URLS
    data.app.get('/ip', (req, res) => res.render("not_implemented", {
        title: "NetworkBlocks IPAM",
        custom_js: ["dom.js", "tools.js"],
        session: user.get_session_data(req),
    }));

    user.setup_routes(data.app);
    webdb.setup_routes(data.app);
}

function setup_error_handling() {
    // custom 404 page
    data.app.use((req, res) => {
        res.status(404);
        if(req.headers["content-type"] === "application/json")
            res.json({error: "Page not found"})
        else
            res.render('404');
    })

    // custom 500 page
    data.app.use((err, req, res, next) => {
        console.error(err.message);
        res.status(500);
        if(req.headers["content-type"] === "application/json")
            res.json({error: "Internal server error"})
        else
            res.render('500');
    })
}

function start_app(config) {
    data.config = config;
    user.initialize(config);
    webdb.initialize(config, user);

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