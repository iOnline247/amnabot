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

function renderDashboard(req, res, user) {
	console.log('Rendering the dashboard page');

	var userName = user.screen_name;
	return res.render('pages/dashboard', {
		title: 'Hi, @'+ userName + '. Welcome to your dashboard',
		csrfToken: req.csrfToken()
	});
}

function getAccessToken(req, res, request_token, User) {
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
				return handleError(err, 'Invalid getOAuth token request');
			}

			var userTokens = {
				access_token: access_token,
				access_token_secret: access_token_secret,
				request_token: request_token,
				screen_name: results.screen_name,
				user_id: results.user_id
			};
			var ifExistsQuery = { 
				user_id: results.user_id
			};

			req.session.user = userTokens;

			// Find user and update or save new.
			// Will overwrite in case app is revoked or something changes.
			User.findOne(ifExistsQuery, function(err, doc) {
				if(err) {
					return handleError(err);
				} else if(doc) {
					User.update(ifExistsQuery, { $set: userTokens }).exec();
					res.redirect('/dashboard');
				} else {
					var user = new User(userTokens);

					user.save(function(err) {
						// var unknownError = err && err.code !== 11000;
						// 11000 user already exists.
						if(err) {
							// var error = 'Couldn\'t authenticate properly.';

							// TODO:
							// Handle displaying error in dashboard page.
							res.render('pages/dashboard', {
								title: err,
								error: err,
								csrfToken: req.csrfToken()
							});
						} else {
							res.redirect('/dashboard');
						}
					});
				}
			});
		}
	);
}

// Routes
router.get('/', function(req, res) {
	console.log('Rendering the home page');
	res.render('pages/default', { title: 'Home' });
});

router.get('/login', function(req, res) {
	console.log('Getting request token from Twitter...');
	var user = req.session.user;
	var authUrl = 'https://api.twitter.com/oauth/request_token';

	// TODO:
	// Get this to work.
	if(user) {
		res.redirect('/dashboard');
	} else {
		twitter.getOAuthRequestToken(
			{
				// TODO:
				// Add this to the global config for DEV/TEST/PROD.
				oauth_callback: appUrl
			},
			function (err, oauth_token, oauth_token_secret, results) {
				if (err) {
					return handleError(err);
				}

				req.reqToken.value = oauth_token_secret;
				res.redirect('https://api.twitter.com/oauth/authorize?oauth_token=' + oauth_token);
			}
		);
	}
});

router.get('/logout', function(req, res) {
	req.session.destroy();
	req.reqToken.destroy();

	res.redirect('/');
});

router.get('/dashboard', function(req, res) {
	var request_token = req.reqToken.value;
	var db = req.db;
	var Users = db.Users;
	var user = req.session.user;

	req.reqToken.reset();

	if(user) {
		renderDashboard(req, res, user);
	} else if(request_token) {
		getAccessToken(req, res, request_token, Users);
	} else {
		res.redirect('/login');
	}
});

module.exports = router;