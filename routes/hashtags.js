var handleError = require('../utils/logError');
var express = require('express');
var extend = require('extend');
var randomString = require('../utils/randomString');

function res500(res) {
	return 	res.status(500)
				.send({ error: 'Unexpected error while querying the database' });
}

function res400(res, id) {
	return res.status(400).send({
		error: 'Invalid hashtag: ' + id
	});
}

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

		Users.findOne({ user_id: twitterId })
		.exec(function(err, userSecrets) {
			var dbHasError = err || !userSecrets || !userSecrets.hashtags;
			if(dbHasError) {
				res500(res);
			} else {
				res.json(userSecrets.hashtags);
				/*
					userSecrets.hashtags.sort(function (a, b) {
						if (a.frequency > b.frequency) {
							return -1;
						}
						if (a.frequency < b.frequency) {
							return 1;
						}

						return 0;
					})
				*/
			}
		});
	})
	.get('/:id', function(req, res) {
		var Users = req.db.Users;
		var twitterId = req.deets.user.user_id;
		var id = req.params.id;

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			if(err) {
				return res500(res);
			} else {
				var hashtag = userSecrets.hashtags.reduce(function(curr, next) {
					if(curr.idx === id) {
						return curr;
					} else {
						return next;
					}
				});

				if(hashtag) {
					res.json(hashtag);
				} else {
					res400(res, id);
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
				return res500(res);
			}

			userSecrets.hashtags.push(hashtag);
			userSecrets.save(function(err) {
				if(err) {
					res500(res);
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

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			if(err) {
				return res500(res);
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
				res400(res, id);
			}
		});
	})
	.delete('/:id', function(req, res) {
		var Users = req.db.Users;
		var twitterId = req.deets.user.user_id;
		var id = req.params.id;
		var idx = -1;

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			if(err) {
				return res500(res);
			}

			userSecrets.hashtags.forEach(function(curr, index){
				if(curr.idx === id) {
					idx = index;
				}
			});

			if(idx > -1) {
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
			} else {
				res400(res, id);
			}
		});
	});

	// TODO:
	// Prefix API calls with _api.
	// app.use('/_api', router);
	return router;
}

module.exports.init = init;