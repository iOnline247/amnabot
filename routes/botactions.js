var handleError = require('../utils/logError');
var express = require('express');
var extend = require('extend');

// Botaction Utils.
function res500(res) {
	return res.status(500)
				.send({ error: 'Unexpected error while querying the database' });
}

function sanitizeSearchTypes(searchTypes) {
	var SEARCH_TYPES = {
		popular: true,
		mixed: true,
		recent: true
	};

	searchTypes = Array.isArray(searchTypes) ?
		searchTypes :
		Array.of(searchTypes || [])
	;
	// Removes invalid types.
	return searchTypes.filter(v => {
		return SEARCH_TYPES[v];
	});
}

function init(app) {
	var router = express.Router();
	// Verify auth of the requests.
	router.use(function(req, res, next) {
	    // Authorize for /api calls.
	    try {
	    	req.db.userQuery = { user_id: req.deets.user.user_id };
	    	req.db.user = req.db.Users.findOne(req.db.userQuery);

	    	next();
	    } catch(e) {
	    	res.redirect('/login');
	    	return next(new Error('User not authenticated.'));
	    }
	})
	.get('/', function(req, res) {
		req.db.user.exec(function(err, userSecrets) {
			if(err || !userSecrets) {
				res500(res);
			} else {
				res.json(userSecrets.botActions);	
			}
		});
	})
	.get('/search-terms/searchTypes', function(req, res) {
		req.db.user.exec(function(err, userSecrets) {
			if(err || !userSecrets) {
				res500(res);
			} else {
				res.json(userSecrets.botActions['search-terms'].searchTypes);	
			}
		});
	})
	.put('/search-terms/searchTypes', function(req, res) {
		var searchTypes = sanitizeSearchTypes(req.body['searchTypes[]']);

		req.db.user.exec(function(err, userSecrets) {
			if(err || !userSecrets) {
				res500(res);
				return;
			}

			var subDoc = userSecrets.botActions['search-terms'];

			if(subDoc) {
				var update = {};
				update['botActions.search-terms.searchTypes'] = searchTypes;

				req.db.user.update(req.db.userQuery, update, function(err) {
					if(err) {
						res500(res);
					} else {
						res.json({
							response: 'OK',
							status: 200
						});
					}
				});
			} else {
				res500(res);
			}
		});
	})
	.put('/:botAction', function(req, res) {
		var botAction = req.params.botAction;
		var active = !!JSON.parse(req.body.active || null);

		req.db.user.exec(function(err, userSecrets) {
			if(err || !userSecrets) {
				res500(res);
				return;
			}

			var subDoc = userSecrets.botActions[botAction];

			if(subDoc) {
				var update = {};
				update['botActions.' + botAction + '.activated'] = active;

				req.db.user.update(req.db.userQuery, update, function(err) {
					if(err) {
						res500(res);
					} else {
						res.json({
							response: 'OK',
							status: 200
						});
					}
				});
			} else {
				res.status(400).send({
					error: 'Invalid botaction'
				});
			}
		});
	});

	// TODO: 
	// Prefix API calls with _api.
	// app.use('/_api', router);
	return router;
}

module.exports.init = init;