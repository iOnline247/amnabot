var environment = require('./utils/environment');
var isDev = environment === 'dev';
var initBotActions = require('./botActions');

// Utils.
var randomString = require('./utils/randomString');
var log = require('./utils/log');
var path = require('path');

// DB connection.
var mongoose = require('mongoose');
mongoose.connect(require('./config/dbUri'));
var db = mongoose.connection;

// Models
var Users = require('./models/users').init(mongoose);

// DB Events.
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('MongoDB Connection Opened');
  // initBotActions(Users);
});

// Web app
var port = process.env.PORT || 2015;
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var csrf = require('csurf');
var sessions = require('client-sessions');
var helmet = require('helmet');
var express = require('express');
var app = express();
// var routes = require('./routes/routes');
// var hashtags = require('./routes/hashtags');

/*
 * Web app
*/

// Make our db and model(s) accessible to our requests.
// https://developer.ibm.com/bluemix/2015/10/08/resilient-connections-between-node-and-mongodb-in-bluemix/
app.use(function(req, res, next){
    req.db = db;
    req.db.Users = Users;
    next();
});

// TODO: Wrap this with ENV var for DEV.
// Test this, then remove TODO.
if(isDev) {
  app.locals.pretty = true;
}

// Middleware
app.use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(cookieParser())
  .use(express.static(path.join(__dirname, 'public')))
  .use(helmet())
  .use(
    sessions({
      cookieName: 'session',
      secret: randomString(32),
      // duration: 60 * 60 * 1000,
      activeDuration: 30 * 60 * 1000
    })
  )
  .use(sessions({
    cookieName: 'deets',
    secret: randomString(32),
    duration: 365 * 24 * 60 * 60 * 1000,
    activeDuration: 24 * 60 * 60 * 1000,
    cookie: {
      // path: '/api', // cookie will only be sent to requests under '/api'
      // maxAge: 60000, // duration of the cookie in milliseconds, defaults to duration above
      ephemeral: false, // when true, cookie expires when the browser closes
      httpOnly: false, // when true, cookie is not accessible from javascript
      secure: !isDev // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
    }
  }))
  .use(csrf())
  // Cache token within cookie for usage in
  // determining Authorization of requests.
  .use(function(req, res, next) {
    var csrfToken = req.csrfToken();

    res.cookie('XSRF-TOKEN', csrfToken);
    res.locals.csrftoken = csrfToken;

    next();
  })
  .set('view engine', 'ejs');

/*
 * Routes
*/
app.use('/', require('./routes/routes'));
// API Routes
app.use('/hashtags', require('./routes/hashtags').init(app));
app.use('/botactions', require('./routes/botactions').init(app));

var server = app.listen(port, function() {
  log('Listening on port:', port);
});