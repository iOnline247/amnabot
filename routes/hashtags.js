var handleError = require('../utils/logError');

module.exports = {
	create: function(req, res) {
		debugger;
	},
	read: {
		hashtags: function(req, res) {
			// TODO:
			// Find out how to extrapolate data from
			// URI on a request within Express: /api/{userId}/hashtags
			var User = req.db.User;
			var twitterId = eq.session.user.user_id;

			// psuedocode
			// look up MongoDB API for how to do this properly.
			User.find({ user_id: twitterId }).exec(function(err, userSecrets) {
				debugger;
			});
		},
		hashtag: function(req, res) {
			// TODO:
			// Find out how to extrapolate data from
			// URI on a request within Express: /api/{userId}/hashtag/{id}
			var User = req.db.User;
			var twitterId = eq.session.user.user_id;

			// psuedocode
			// look up MongoDB API for how to do this properly.
			User.find({ user_id: twitterId }).exec(function(err, userSecrets) {

			});
		}		
	},
	update: function(req, res) {
		debugger;
		res.json(req.body);
	},
	'delete': {

	}
};