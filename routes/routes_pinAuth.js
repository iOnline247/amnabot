var request = require('../node_modules/request');
var qs = require('querystring');
var config = require('../config/auth');

module.exports = {
	"auth": function(req, res) {
		console.log('Rendering the auth page');
		res.render('default');
	},
	"home": function(req, res) {
		console.log('Rendering the home page');
		res.render("default");
	},
	"login": function(req, res) {
		console.log('Getting request token from Twitter...');

		var url = 'https://api.twitter.com/oauth/request_token';
		var oauth = {
			oauth_callback: encodeURIComponent('http://amnabot.azurewebsites.net/auth'),
			consumer_key: config.consumer_key,
			consumer_secret: config.consumer_secret
		};
		// var body = 'oauth_callback="http://amnabot.azurewebsites.net/"';		
		// var url = 'https://api.twitter.com/oauth/authorize';

		request.post({url:url, oauth:oauth}, function (e, r, body) {
			if(e) {
				console.log('Couldn\'t handle the heat; came out of the kitchen. ::: Twitter OAuth failure.');
				return;
			}

			var req_data = qs.parse(body);
			var uri = 'https://api.twitter.com/oauth/authorize'
			+ '?' + qs.stringify({oauth_token: req_data.oauth_token})
			// redirect the user to the authorize uri 
			console.log('Redirecting to Twitter for authorization...');
			res.redirect(uri);
		});
	},
	"_404": function(req, res) {
		res.send("Bad Route");
	}
};