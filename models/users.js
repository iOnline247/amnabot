module.exports.init = function(mongoose) {
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;
	var userSchema = userSchema = new Schema({
		id: ObjectId,
		access_token: String,
		access_token_secret: String,
		hashtags: [],
		request_token: String,
		screen_name: String,
		user_id: { type: String, unique: true }
	});

	return mongoose.model('User', userSchema);
}

/*
module.exports.schema = userSchema = new Schema({
	id: ObjectId,
	access_token: String,
	access_token_secret: String,
	request_token: String,
	screen_name: String,
	user_id: { type: String, unique: true }
});

module.exports.model = mongoose.model('User', userSchema);
*/