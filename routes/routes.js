var express = require('express');
var router = express.Router();
var environment = require('../utils/environment');
var redirectUrls = require('../config/redirect');
var appUrl = (environment === 'dev') ?
	redirectUrls.dev :
	redirectUrls.prod
;
var handleError = require('../utils/logError');
var config = require('../config/auth');
var OAuth = require('oauth');
var twitter = new OAuth.OAuth(
	'https://api.twitter.com/oauth/request_token',
	'https://api.twitter.com/oauth/access_token',
	config.consumer_key,
	config.consumer_secret,
	'1.0A',
	null,
	'HMAC-SHA1'
);

function renderDashboard(req, res) {
	var user = req.deets.user;
	var userName = user.screen_name;
	var reqToken = req.deets.reqToken;

	if(reqToken) {
		req.deets.reqToken = null;
		return res.redirect('/dashboard');
	}

	console.log('Rendering the dashboard page');
	res.render('pages/dashboard', {
		title: 'Hi, @'+ userName + '. Welcome to your dashboard',
		csrfToken: req.csrfToken(),
		userName: userName,
		loggedIn: true
	});
}

function getAccessToken(req, res, request_token, Users, next) {
	console.log('Getting OAuth access token...');

	var params = req.query;
	var oauth_token = params.oauth_token;
	var oauth_verifier = params.oauth_verifier;

	twitter.getOAuthAccessToken(
		oauth_token,
		request_token,
		oauth_verifier,
		function(err, access_token, access_token_secret, results) {
			if(err) {
				// 'Invalid getOAuth token request'
				return next(err);
			}

			var userTokens = {
				access_token: access_token,
				access_token_secret: access_token_secret,
				request_token: request_token,
				screen_name: results.screen_name,
				user_id: results.user_id
			};
			var userExistsQuery = {
				user_id: results.user_id
			};

			// Set cookie and locals for use in templates.
			req.deets.user = req.user = res.locals.user = userTokens;

			// Find user and update or save new.
			// Will overwrite in case app is revoked or something changes.
			Users.findOne(userExistsQuery, function(err, doc) {
				if(err) {
					next(err);
				} else if(doc) {
					Users.update(userExistsQuery, { $set: userTokens }).exec(next);
				} else {
					var user = new Users(userTokens);

					user.save(next);
				}
			});
		}
	);
}

function reqTokenCheck(req, res, next) {
	var request_token = req.deets.reqToken;
	var user = req.deets.user;

	if(user) {
		next();
	} else if(request_token) {
		var db = req.db;
		var Users = db.Users;
		getAccessToken(req, res, request_token, Users, next);
	} else {
		res.redirect('/login');
	}
}

function requireLogin(req, res, next) {
	if (!req.deets.user) {
		res.redirect('/login');
	} else {
		next();
	}
}

// Routes
/*
router.use(function(req, res, next) {
  if (req.session && req.session.user) {
    Users.findOne({ user_id: req.session.user.user_id }, function(err, user) {
      if (user) {
        req.user = user;
        req.session.user = user;
        res.locals.user = user;
      }

      next();
    });
    } else {
      next();
  }
})
*/
router.get('/', function(req, res) {
	console.log('Rendering the home page');
	res.render('pages/default', { 
		title: 'Home',
		userName: 'Home',
		loggedIn: false 
	});
})
.get('/login', function(req, res) {
	console.log('Getting request token from Twitter...');
	var user = req.deets.user;

	if(user) {
		res.redirect('/dashboard');
	} else {
		twitter.getOAuthRequestToken(
			{
				oauth_callback: appUrl
			},
			function (err, oauth_token, oauth_token_secret, results) {
				if (err) {
					return handleError(err);
				}

				req.deets.reqToken = oauth_token_secret;
				res.redirect('https://api.twitter.com/oauth/authorize?oauth_token=' + oauth_token);
			}
		);
	}
})
.get('/logout', function(req, res) {
	req.deets.destroy();
	res.redirect('/');
})
.get('/dashboard', [reqTokenCheck, requireLogin], renderDashboard);


module.exports = router;