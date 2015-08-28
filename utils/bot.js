//
//  Bot
//  class for performing various twitter actions
//
module.exports = Bot;

var Twit = require('twit');
var request = require('request');
var randIndex = require('./randIndex');

function Bot(config) {
  this.config = config;
  this.twit = new Twit(config);
}


//
//  post a tweet
//
Bot.prototype.tweet = function (status, params, callback) {
  if(typeof params === 'function') {
    callback = params;
    params = {};
  }

  var invalidParamType = typeof status !== 'string' && typeof params.status !== 'string';
  var invalidLength = status.length > 140 || params.status > 140;
  var tweetLength = status.length || param.status.length;

  if(invalidParamType) {
    return callback(new Error('Tweet must be of type string.'));
  } else if(invalidLength) {
    return callback(new Error('Tweet is too long: ' + tweetLength));
  }

  params.status = params.status || status;
  this.twit.post('statuses/update', params, callback);
};

//
// Upload a photo
//
Bot.prototype.uploadPhoto = function(photoUrl, params, callback) {
  var self = this;

  if(typeof params === 'function') {
    callback = params;
    params = {};
  }

  request({url: photoUrl, encoding: null}, function(err, res, body) {
    if(err) {
      return callback(err);
    }

    // https://github.com/riyadhalnur/node-base64-image/blob/master/index.js
    if (body && res.statusCode === 200) {
      var image = body.toString('base64');

      params.media_data = image;
      self.twit.post('media/upload', params, callback);
    } else {
      callback(new Error('Bot-Upload Photo: Unknown Error, http status code: ' + res.statusCode));
    }
  });
};

//
//  choose a random friend of one of your followers, and follow that user
//
Bot.prototype.mingle = function (callback) {
  var self = this;

  this.twit.get('followers/ids', {stringify_ids: true}, function(err, followers) {
    if(err) {
      return callback(err);
    }

    var followerId  = randIndex(followers.ids);

    self.twit.get('friends/ids', { user_id: followerId, stringify_ids: true }, function(err, friends) {
      if(err) { 
        return callback(err); 
      }

      var friendId  = randIndex(friends.ids);

      self.twit.post('friendships/create', { id: friendId }, callback);
    });
  });
};

//
//  prune your followers list; unfollow a friend that hasn't followed you back
//
Bot.prototype.prune = function (callback) {
  var self = this;

  this.twit.get('followers/ids', function(err, reply) {
      if(err) return callback(err);

      var followers = reply.ids;

      self.twit.get('friends/ids', function(err, reply) {
          if(err) return callback(err);

          var friends = reply.ids
            , pruned = false;

          while(!pruned) {
            var target = randIndex(friends);

            if(!~followers.indexOf(target)) {
              pruned = true;
              self.twit.post('friendships/destroy', { id: target }, callback);
            }
          }
      });
  });
};