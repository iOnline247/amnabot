module.exports = botActions;
var Users;

// TODO:
// Restructure code to query DB on each
// action instead of caching in
// autobotsRollout.

function botActions(UsersModel) {
    Users = UsersModel;
    autobotsRollout(Users)
        .then(function() {
            // Bot Actions
            favoriteMentions(15 * 60 * 1000);
            // autoFollow(20 * 1000);
            // retweetFromUsers(12 * 60 * 60 * 1000);
            retweetFromSearch(15 * 60 * 1000);
            // autoPrune(2 * 60 * 60 * 1000);
            // makeFrienships(100 * 60 * 1000);
        });
}

// Autobots.
var Bot = require('./utils/bot');
var config = require('./config/auth');
var bots = [];
var ops = {
    get: {
        mentions: {
            op: 'statuses/mentions_timeline',
            since_id: '1'
        },
        rtFromUsers: {
            users: [
                'causticbob',
                'funTweeters',
                'SarahCAndersen',
                'TheCrashCourse',
                'thinkprogress',
                'whitehouse',
                'WittySassBasket'
            ],
            userIndex: 0,
            op: 'statuses/user_timeline',
            since_id: '1'
        },
        search: {
            op: 'search/tweets',
            since_id: '1'
        }
    },
    post: {
        favorites: {
            create: 'favorites/create'
        }
    }
};
var rnaughtyNaughty = /#(?:boobs?|milf|naked|porno?|idgaf)|(?:fetish|booty|nsfw|cock)/i;

// Utils.
var randIdx = require('./utils/randIndex');
var weightedRandIdx = require('./utils/weightedRandomIndex');
var extend = require('extend');
var handleError = require('./utils/logError');
var log = require('./utils/log');

// Find Bots.
function autobotsRollout(Users, retryAfterMs) {
    retryAfterMs = retryAfterMs || 60 * 60 * 1000;
    var fields = [
        'user_id',
        'screen_name',
        'access_token',
        'access_token_secret',
        'botActions',
        'hashtags',
        'memes',
        'rtUsers'
    ];

    log('Querying Mongo for valid users...');
    return Users.find({})
        .select(fields.join(' '))
        .exec(
            function(err, userSecrets) {
                if(err) {
                    handleError('Error querying Mongo', err);

                    return setTimeout(autobotsRollout, 30 * 1000, Users, retryAfterMs);
                }

                bots = userSecrets.map(function(v, i) {
                    var opts = {
                        access_token: v.access_token,
                        access_token_secret: v.access_token_secret,
                        screen_name: v.screen_name,
                        user_id: v.user_id,
                        botActions: v.botActions.toJSON(),
                        hashtags: v.hashtags,
                        memes: v.memes,
                        rtUsers: v.rtUsers
                    };

                    return new Bot(extend({}, config, opts));
                });

                log('Bots found:', bots.length);
                setTimeout(autobotsRollout, retryAfterMs, Users, retryAfterMs);
            }
        );
}

// Bot Actions.
function autoFollow(retryAfterMs) {
    // TODO:
    // Get activation of memes from DB.
    // Get memes from DB.
/*
    var memes [
        {
            "text": "That follow tho.",
            "url": "http://i.imgur.com/gMy40IP.png"
        },
        {
            "text": "While you are sleeping, we\'ll be up tweeting.",
            "url": "http://i.imgur.com/Zf9MwHY.jpg"
        },
        {
            "text": "Thinking you are just like me!",
            "url": "http://i.imgur.com/OpTiTwK.jpg"
        },
        {
            "text": "Awwww... you chose me!",
            "url": "http://i.imgur.com/JgcIuwR.jpg"
        },
        {
            "text": "I am watching you watching me...",
            "url": "http://i.imgur.com/jPrJRb4.png"
        },
        {
            "text": "Welcome! Now pay attention...",
            "url": 'http://i.imgur.com/HGFEFzd.jpg'
        },
        {
            "text": "Thanks for understanding us.",
            "url": "http://i.imgur.com/tCeEDup.jpg"
        },
        {
            "text": "Stay tuned. You never know what\'ll happen next...",
            "url": "http://i.imgur.com/3VNxkJP.jpg"
        },
        {
            "text": "We think you\'re cool too. We think you\'re THIS cool.",
            "url": "http://i.imgur.com/vJJvxkJ.jpg"
        }
    ];
*/
    var memeFrequency = memes.map(function(v, i, arr) {
        var numOfItems = arr.length;
        var percentageFrequency = 100 / numOfItems;
        return numOfItems / ((numOfItems * 100) / percentageFrequency);
    });

    bots.forEach(function(bot) {
        // DEBUG param: {count: 200}
        bot.twit.get('followers/list', function(err, data) {
            if(err) {
                return handleError(err, 'Autofollow: followers/list');
            }

            var followers = data.users;

            followers.filter(function(user, i) {
                return user.following === false;
            })
            .slice(0, 15)
            .forEach(function(user, i) {
                bot.twit.post('friendships/create', { id: user.id_str }, function(err) {
                    if(err) {
                        handleError(err, 'friendships/create');
                    }

                    var tweetPic = weightedRandIdx(memes, memeFrequency);
                    var mentionUser = '@' + user.screen_name;
                    var tweetText = mentionUser + ' ' + tweetPic.text;

                    bot.uploadPhoto(tweetPic.url, function(err, reply) {
                        if(err) {
                            handleError(err, 'Autofollow:uploadPhoto');
                        }

                        bot.tweet(
                            tweetText,
                            {
                                media_ids: reply.media_id_string,
                                trim_user: true
                            },
                            function(err, reply) {
                                log('Autofollow:Tweet', mentionUser, err || reply);
                            }
                        );
                    });
                });
            });
        });
    });

    setTimeout(autoFollow, retryAfterMs, retryAfterMs);
}

function autoPrune(retryAfterMs) {
    bots.forEach(function(bot) {
        bot.prune(function(err, reply) {
            if(err) {
                handleError(err, 'prune');
            } else {
                log('Pruned:', '@' + reply.screen_name);
            }
        });
    });

    setTimeout(autoPrune, retryAfterMs, retryAfterMs);
}

function retweetFromSearch(retryAfterMs) {
    var fields = [
        'hashtags',
        'botActions.search-terms.since_id',
        'botActions.search-terms.activated'
    ];
    // TODO:
    // Add checkboxes to search terms tab
    // enabling the type of search.
    var resultTypes = ['popular', 'mixed', 'recent'];

    bots.forEach(function(bot, i) {
        var config = bot.config;
        var userQuery = {
            user_id: config.user_id
        };

        Users.findOne(userQuery)
        .select(fields.join(' '))
        .exec(function(err, userSecrets) {
            if(err) {
                return handleError(err);
            } else {
                var config = userSecrets.botActions['search-terms'].toJSON();
                var hashtags = userSecrets.hashtags;

                if(!config.activated || !hashtags.length) {
                    console.log(
                        bot.config.screen_name + ': {\n\tactivated:',
                        config.activated, ', hashtags:', hashtags.length, '\n}'
                    );
                    return;
                }

                var searchOpts = {
                        count: 100,
                        result_type: randIdx(resultTypes),
                        since_id: config.since_id
                };
                var topics = hashtags.map(function(v) {
                    return v.name;
                });
                var frequencyOfTopics = hashtags.map(function(v) {
                    return v.frequency *1;
                });

                searchOpts.q = weightedRandIdx(topics, frequencyOfTopics);

                bot.twit.get(ops.get.search.op, searchOpts,
                    function(err, reply) {
                        if(err) {
                            return handleError(err, 'search/tweets');
                        }

                        var tweets = reply.statuses;
                        // if no tweets, Amnabot is sad and returns early.
                        if(!tweets.length) {
                            return log('No tweets were found using hashtag:', decodeURIComponent(reply.search_metadata.query), searchOpts.result_type);
                        }

                        popularTweet = tweets.reduce(function(curr, next) {
                            // Don't think a popular tweet will have 0 RTs, but
                            // >= will push a *real* tweet into the `next` variable
                            // on first iteration.
                            // Added English text only for retweets.
                            var shouldRT = (next.retweet_count >= curr.retweet_count) &&
                                (!next.possibly_sensitive) &&
                                (next.lang === 'en' || next.lang === 'en-gb') &&
                                (!rnaughtyNaughty.test(next.text));

                            if(shouldRT) {
                                searchOpts.since_id = next.id_str;
                                return next;
                            }

                            return curr;
                        }, { retweet_count: 0 });

                        // The search.since_id is set for different topics and can be set to a
                        // tweet that will allow the algo to query and find a tweet that was
                        // previously RT'd.  This will prevent the issue.  Adding this check
                        // in the Array#reduce function produced too many tweets that were
                        // irrelavant.  Will update this approach if needed.
                        if(!popularTweet.retweeted) {
                            log('RTFromSearch:', searchOpts.result_type, searchOpts.q, popularTweet.text);

                            // TODO:
                            // Remove hardcoded Twitter API action.
                            // Update botAction with id_str for
                            // querying search. Remove: ops.get.search.since_id.
                            bot.twit.post('statuses/retweet/' + popularTweet.id_str, { trim_user: true },
                                function(err, reply) {
                                    return (err) ?
                                        // TODO:
                                        // Remove hardcoded Twitter API action.
                                        handleError(err, 'Error RT\'ing: statuses/retweet') :
                                        log(reply);
                                }
                            );


                            var update = {};
                            update['botActions.search-terms.since_id'] = searchOpts.since_id;
                            Users.update(userQuery, update, function(err) {
                                if(err) {
                                    handleError(err);
                                } else {
                                    log('#retweetFromSearch-Updated: since_id');
                                }
                            });
                        } else {
                            log('RTFromSearch:', searchOpts.result_type, searchOpts.q, 'No tweets were worthy of RT\'ing.');
                        }
                    }
                );
            }
        })
    });

    setTimeout(retweetFromSearch, retryAfterMs, retryAfterMs);
}

function retweetFromUsers(retryAfterMs) {
    bots.forEach(function(bot, i) {
        // TODO:
        // Get rtFromUsers from the DB.
        var currOps = ops.get.rtFromUsers;
        var users = currOps.users;

        if(currOps.userIndex === users.length) {
            ops.get.rtFromUsers.userIndex = 0;
        }

        var user = users[ops.get.rtFromUsers.userIndex++];
        var queryOpts = {
                count: 200,
                screen_name: user,
                // since_id: ops.get.rtFromUsers.since_id,
                trim_user: true
        };

        bot.twit.get(currOps.op, queryOpts,
            function(err, tweets) {
                if(err) {
                    return handleError(err, currOps.op);
                }

                // if no tweets, Amnabot is sad and returns early.
                if(tweets.length === 0) {
                    return log('No tweets were found for:', user);
                }

                popularTweet = tweets.reduce(function(curr, next) {
                    // Don't think a popular tweet will have 0 RTs, but
                    // >= will push a *real* tweet into the variable.
                    // Added English text only for retweets.
                    var shouldRT = (next.retweet_count >= curr.retweet_count) &&
                        (!rnaughtyNaughty.test(next.text));

                    if(shouldRT) {
                        ops.get.rtFromUsers.since_id = next.id_str;
                        return next;
                    }

                    return curr;
                }, { retweet_count: 0 });

                // The search.since_id is set for different topics and can be set to a
                // tweet that will allow the algo to query and find a tweet that was
                // previously RT'd.  This will prevent the issue.  Adding this check
                // in the Array#reduce function produced too many tweets that were
                // irrelavant.  Will update this approach if needed.
                if(!popularTweet.retweeted) {
                    log('RTFromUser:', user, popularTweet.text);

                    // TODO:
                    // Remove hardcoded Twitter API action.
                    bot.twit.post('statuses/retweet/' + popularTweet.id_str,
                        {trim_user: true},
                        function(err, reply) {
                            return (err) ?
                                // TODO:
                                // Remove hardcoded Twitter API action.
                                handleError(err, 'Error RT\'ing: statuses/retweet') :
                                log(reply);
                        }
                    );
                } else {
                    log('RTFromUser:', user, 'No tweets were worthy of RT\'ing.');
                }
            }
        );
    });

    setTimeout(retweetFromUsers, retryAfterMs, retryAfterMs);
}

function makeFrienships(retryAfterMs) {
    bots.forEach(function(bot) {
        bot.mingle(function(err, reply) {
            if(err) {
                handleError(err, 'mingle');
            } else {
                log('Mingled with: ', '@' + reply.screen_name);
            }
        });
    });

    setTimeout(makeFrienships, retryAfterMs, retryAfterMs);
}

function favoriteMentions(retryAfterMs) {
    var fields = [
        'botActions.favorites.since_id',
        'botActions.favorites.activated'
    ];

    bots.forEach(function(bot) {
        var userQuery = {
            user_id: bot.config.user_id
        };

        Users.findOne(userQuery)
        .select(fields.join(' '))
        .exec(function(err, userSecrets) {
            if(err) {
                return handleError(err);
            } else {
                var config = userSecrets.botActions.favorites.toJSON();

                if(!config.activated) {
                    return;
                }

                var queryOpts = {
                    // count: 15,
                    trim_user: true,
                    include_entities: true,
                    since_id: config.since_id
                };

                bot.twit.get(
                    ops.get.mentions.op,
                    queryOpts,
                    function(err, tweets) {
                        if(err) {
                            return handleError(err, ops.get.mentions.op);
                        }

                        // Reverse to make the tweets ascending.
                        // This will make the since_id equal to the last mention.
                        tweets.reverse()
                            .slice(0, 15)
                            .filter(function(v) {
                                return !v.favorited;
                            })
                            .forEach(function(tweet, i) {
                                queryOpts.since_id = tweet.id_str;

                                log('Favoriting:', tweet.id_str, tweet.text);
                                bot.twit.post(ops.post.favorites.create,
                                    {
                                        id: tweet.id_str,
                                        trim_user: true,
                                        include_entities: false
                                    },
                                    function(err, reply) {
                                    }
                                );
                            });

                        var update = {};
                        update['botActions.favorites.since_id'] = queryOpts.since_id;
                        Users.update(userQuery, update, function(err) {
                            if(err) {
                                handleError(err);
                            } else {
                                log('#favoriteMentions-Updated: since_id');
                            }
                        });
                    }
                );
            }
        });
    });

    setTimeout(favoriteMentions, retryAfterMs, retryAfterMs);
}