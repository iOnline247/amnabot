module.exports.init = function(mongoose) {
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;
	var userSchema = userSchema = new Schema({
		id: ObjectId,
		access_token: String,
		access_token_secret: String,
		botActions: {
			favorites: {
				activated: { type: Boolean, default: true },
				since_id: { type: String, default: '1' }
			},
			memes: {
				activated: { type: Boolean, default: true },
				since_id: { type: String, default: '1' }
			},
			"rt-users": {
				activated: { type: Boolean, default: true },
				since_id: { type: String, default: '1' }
			},
			"search-terms": {
				activated: { type: Boolean, default: true },
				since_id: { type: String, default: '1' }
			}
		},
		hashtags: Array,
		memes: Array,
		request_token: String,
		screen_name: String,
		user_id: { type: String, unique: true }
	});

	return mongoose.model('User', userSchema);
}