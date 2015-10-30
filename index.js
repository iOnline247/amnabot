var environment = require('./utils/environment');
var initBotActions = require('./botActions');

// Utils.
var randomString = require('./utils/randomString');
var log = require('./utils/log');

// DB connection.
// TODO:
// https://developer.ibm.com/bluemix/2015/10/08/resilient-connections-between-node-and-mongodb-in-bluemix/
var mongoose = require('mongoose');
mongoose.connect(require('./config/dbUri'));
var db = mongoose.connection;

// Models
var Users = require('./models/users').init(mongoose);

// DB Events.
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
          log('**********************************');
  console.log('~');
  console.log('~    MongoDB Connection Opened');
  console.log('~');
  console.log('**********************************');

  // initBotActions(Users);
});

// Web app
var port = process.env.PORT || 2015;
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var csrf = require('csurf');
var sessions = require('client-sessions');
var express = require('express');
var app = express();
// var routes = require('./routes/routes');
var hashtags = require('./routes/hashtags');

/*
 * Web app
*/

// Make our db and model(s) accessible to our requests.
app.use(function(req, res, next){
    req.db = db;
    req.db.Users = Users;
    next();
});

// TODO: Wrap this with ENV var for DEV.
// Test this, then remove TODO.
if(environment === 'dev') {
  app.locals.pretty = true;
}

// Cookies
app.use(sessions({
  cookieName: 'reqToken',
  secret: randomString(32),
  duration: 5 * 60 * 1000, // how long the session will stay valid in ms
  cookie: {
    // TODO:
    // Change this back.
    httpOnly: true,
    secure: false
  }
}));
app.use(sessions({
  cookieName: 'session',
  secret: randomString(32),
  // duration: 60 * 60 * 1000,
  // activeDuration: 5 * 60 * 1000,
  cookie: {
    path: '/dashboard',
    ephemeral: false,
    // TODO:
    // Change this back.
    httpOnly: true,
    secure: false
  }
}));

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(csrf());


// Cache token within cookie for usage in
// determining Authorization of requests.
app.use(function(req, res, next) {
  var csrfToken = req.csrfToken();

  res.cookie('XSRF-TOKEN', csrfToken);
  res.locals.csrftoken = csrfToken;
  next();
});

app.disable('x-powered-by');
app.set('view engine', 'ejs');

/*
 * Routes
*/
app.use('/', require('./routes/routes'));

/*
// API Routes
var router = express.Router();

// Verify auth of the requests.
router.use(function(req, res, next) {
    // TODO:
    // Verify _csrf
    // Authorize for /api calls.
    console.log('Something is happening.');
    next();
});

// TODO:
// Make this route user specific.
router.post('/hashtag/:id', hashtags.update);
// Make this route user specific.
router.get('/hashtags', hashtags.read.hashtags);
router.get('/hashtag/:id', hashtags.read.hashtag);
// Make this route user specific.
router.post('/hashtag', hashtags.create);

// Prefix routes with /api
app.use('/api', router);
*/
var server = app.listen(port, function() {
  log('Listening on port:', port);
});