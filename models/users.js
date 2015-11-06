module.exports.init = function(mongoose) {
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;
	var userSchema = userSchema = new Schema({
		id: ObjectId,
		access_token: String,
		access_token_secret: String,
		botActions: {
			"search-terms": {
				activated: { type: Boolean, default: true }
			},
			memes: {
				activated: { type: Boolean, default: true }
			},
			"rt-users": {
				activated: { type: Boolean, default: true }
			}
		},
		hashtags: [],
		request_token: String,
		screen_name: String,
		user_id: { type: String, unique: true }
	});

	return mongoose.model('User', userSchema);
}