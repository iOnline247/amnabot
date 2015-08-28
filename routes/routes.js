var request = require('request');
var config = require('../config/auth');
var dbDeets = require('../config/db');
var User = dbDeets.users;


var OAuth = require('oauth');
var oauth = new OAuth.OAuth(
	'https://api.twitter.com/oauth/request_token',
	'https://api.twitter.com/oauth/access_token',
	config.consumer_key,
	config.consumer_secret,
	'1.0A',
	null,
	'HMAC-SHA1'
);
var handleError = require('../utils/logError');


module.exports = {
	'get': {
		'dashboard': function(req, res) {
			var params = req.query;
			var oauth_token = params.oauth_token;
			var oauth_verifier = params.oauth_verifier;
			var request_token = req.reqToken.value;
			var user = req.session.user;

			req.reqToken.reset();

			if(user) {
				console.log('Rendering the dashboard page');

				var userName = user.screen_name;
				return res.render('pages/dashboard', {
					title: 'Hi, @'+ userName + '. Welcome to your dashboard',
					csrfToken: req.csrfToken()
				});
			} else if(request_token) {
				console.log('Getting OAuth access token...');

				oauth.getOAuthAccessToken(
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

						req.session.user = userTokens;
						// TODO:
						// save these differently.
						var user = new User(userTokens);

						// Add overwrite here in case app is revoked.
						user.save(function(err) {
							// 11000 user already exists.
							if(err && err.code !== 11000) {
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
				);
			} else {
				res.redirect('/login');
			}
		},
		'home': function(req, res) {
			console.log('Rendering the home page');
			res.render('pages/default', { title: 'Home' });
		},
		'login': function(req, res) {
			console.log('Getting request token from Twitter...');
			var user = req.session.user;
			var authUrl = 'https://api.twitter.com/oauth/request_token';

			// TODO:
			// Get this to work.
			if(user) {
				res.redirect('/dashboard');
			} else {
				oauth.getOAuthRequestToken(
					{
						// TODO:
						// Add this to the global config for DEV/TEST/PROD.
						oauth_callback: 'http://amnabot.azurewebsites.net/dashboard'
					},
					function (e, oauth_token, oauth_token_secret, results) {
						if (e) {
							console.error(e);
							return;
						}

						req.reqToken.value = oauth_token_secret;
						var redirectUrl = 'https://api.twitter.com/oauth/authorize?oauth_token=' + oauth_token;

						res.redirect(redirectUrl);
					}
				);
			}
		},
		'logout': function(req, res) {
			req.session.destroy();
			req.reqToken.destroy();

			res.redirect('/');
		},
		'_404': function(req, res) {
			res.send('pages/404');
		}
	},
	'post': {
		'dashboard': function(req, res) {
			debugger;
			res.json(req.body);
		}
	}
};