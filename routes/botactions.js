var handleError = require('../utils/logError');
var express = require('express');
var extend = require('../utils/extend');

function init(app) {
	var router = express.Router();
	// Verify auth of the requests.
	router.use(function(req, res, next) {
	    // Authorize for /api calls.
	    try {
	    	var twitterId = req.deets.user.user_id;
	    } catch(e) {
	    	res.redirect('/login');
	    	return next(new Error('User not authenticated.'));
	    }

	    next();
	})
	.get('/', function(req, res) {
		var Users = req.db.Users;
		var twitterId = req.deets.user.user_id;

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			if(err) {
				res.json('Invalid Request.');
			} else {
				res.json(userSecrets.botActions);	
			}
		});
	})
	.put('/:botAction', function(req, res) {
		var Users = req.db.Users;
		var twitterId = req.deets.user.user_id;
		var query = { user_id: twitterId };
		var botAction = req.params.botAction;
		var active = !!JSON.parse(req.body.active);

		Users.findOne(query).exec(function(err, userSecrets) {
			if(err) {
				return res.json('Invalid Request.');
			}

			var subDoc = userSecrets.botActions[botAction];

			if(subDoc) {
				var update = {};
				update['botActions.' + botAction + '.activated'] = active;

				Users.update(query, update, function(err) {
					if(err) {
						res.json('Invalid Request.');
					} else {
						res.json({
							response: 'OK',
							status: 200
						});
					}
				});
		/*
				userSecrets.save(function(err) {
					if(err) {
						res.json('Invalid Request.');
					} else {
						res.json({
							response: 'OK',
							status: 200
						});
					}
				});
		*/			
			} else {
				res.json('Invalid Request.');
			}
		});
	});

	// TODO: 
	// Prefix API calls with _api.
	// app.use('/_api', router);
	return router;
}

module.exports.init = init;