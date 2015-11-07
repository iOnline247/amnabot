var handleError = require('../utils/logError');
var express = require('express');
var extend = require('extend');
var randomString = require('../utils/randomString');

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
				res.json(userSecrets.hashtags);
			}
		});
	})
	.get('/:id', function(req, res) {
		var Users = req.db.Users;
		var twitterId = req.deets.user.user_id;
		var id = req.params.id;

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			if(err) {
				return res.json('Invalid Request.');
			} else {
				var hashtag = userSecrets.hashtags.reduce(function(curr, next){
					if(curr.idx === id) {
						return curr;
					} else {
						return next;
					}
				});

				if(hashtag) {
					res.json(hashtag);
				} else {
					res.json('Invalid Request.');
				}
			}
		});
	})
	.post('/', function(req, res) {
		var Users = req.db.Users;
		var twitterId = req.deets.user.user_id;
		var hashtag = {
			idx: randomString(20),
			frequency: req.body.frequency,
			name: req.body.name
		};

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			if(err) {
				return res.json('Invalid Request.');
			}

			userSecrets.hashtags.push(hashtag);
			userSecrets.save(function(err) {
				if(err) {
					res.json('Invalid Request.');
				} else {
					// hashtag.idx = idx;
					res.json(hashtag);
				}
			});
		});
	})
	.put('/:id', function(req, res) {
		var Users = req.db.Users;
		var twitterId = req.deets.user.user_id;
		var id = req.params.id;
		var idx;
		var update = {
			name: req.body.name,
			frequency: req.body.frequency
		};

		// Removes any undefined keys.
		// Prevents the .extend smashing over
		// real values upon saving.
	/*
		Object.keys(update).forEach(function(key) {
			if(update[key] == null) {
				delete update[key];
			}
		});
	*/

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			if(err) {
				return res.json('Invalid Request.');
			}

			// TODO:
			// Look at #reduce.
			var hashtag = userSecrets.hashtags.filter(function(curr, index){
				if(curr.idx === id) {
					idx = index;
					return curr;
				}
			})[0];

			if(hashtag) {
				userSecrets.hashtags[idx] = extend(hashtag, update);
				// http://mongoosejs.com/docs/api.html#document_Document-markModified
				userSecrets.markModified('hashtags');
				userSecrets.save(function(err) {
					if(err) {
						res.json('Invalid Request.');
					} else {
						res.json(hashtag);
					}
				});
			} else {
				res.json('Invalid Request.');
			}
		});
	})
	.delete('/:id', function(req, res) {
		var Users = req.db.Users;
		var twitterId = req.deets.user.user_id;
		var id = req.params.id;
		var idx;

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			if(err) {
				return res.json('Invalid Request.');
			}

			userSecrets.hashtags.forEach(function(curr, index){
				if(curr.idx === id) {
					idx = index;
				}
			});

			userSecrets.hashtags.splice(idx, 1);
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
		});
	});

	// TODO:
	// Prefix API calls with _api.
	// app.use('/_api', router);
	return router;
}

module.exports.init = init;