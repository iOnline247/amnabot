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

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			var hasDbError = err || (!userSecrets || !userSecrets.memes);
			if(hasDbError) {
				return res500(res);
			} else {
				res.json(userSecrets.memes);
			}
		});
	})
	.get('/:id', function(req, res) {
		var Users = req.db.Users;
		var twitterId = req.deets.user.user_id;
		var id = req.params.id;

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			var hasDbError = err || (!userSecrets || !userSecrets.memes);
			if(hasDbError) {
				return res500(res);
			} else {
				var meme = userSecrets.memes.reduce(function(curr, next){
					if(curr.idx === id) {
						return curr;
					} else {
						return next;
					}
				});

				if(meme) {
					res.json(meme);
				} else {
					res400(res, id);
				}
			}
		});
	})
	.post('/', function(req, res) {
		var Users = req.db.Users;
		var twitterId = req.deets.user.user_id;
		var text = req.body.text || '';
		var url = req.body.url || '';
		var meme = {
			idx: randomString(20),
			text: text.slice(0, 130),
			url: url.slice(0, 255)
		};

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			if(err) {
				return res500(res);
			}

			userSecrets.memes.push(meme);
			userSecrets.save(function(err) {
				if(err) {
					res500(res);
				} else {
					res.json(meme);
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
			text: req.body.text,
			url: req.body.url
		};

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			var hasDbError = err || (!userSecrets || !userSecrets.memes);
			if(hasDbError) {
				return res500(res);
			}

			// TODO:
			// Look at #reduce.
			var meme = userSecrets.memes.filter(function(curr, index){
				if(curr.idx === id) {
					idx = index;
					return curr;
				}
			})[0];

			if(meme) {
				userSecrets.memes[idx] = extend(meme, update);
				// http://mongoosejs.com/docs/api.html#document_Document-markModified
				userSecrets.markModified('memes');
				userSecrets.save(function(err) {
					if(err) {
						res.json('Invalid Request.');
					} else {
						res.json(meme);
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
		var idx;

		Users.findOne({ user_id: twitterId }).exec(function(err, userSecrets) {
			var hasDbError = err || (!userSecrets || !userSecrets.memes);
			if(hasDbError) {
				return res500(res);
			}

			userSecrets.memes.forEach(function(curr, index){
				if(curr.idx === id) {
					idx = index;
				}
			});

			if(idx) {
				userSecrets.memes.splice(idx, 1);
				userSecrets.save(function(err) {
					if(err) {
						res.json('Invalid Request.');
					} else {
						res.json({
							response: 'OK',
							message: 'Meme deleted.'
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