var express = require('express');
var config = require('./config');
var bodyParser = require('body-parser');
var serveStatic = require('serve-static');
var session = require('express-session');
var models = require('./models');
var ejs = require('ejs-mate');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var home = require('./routes/home');
var lib = require('./lib');
var cookieSession = require('cookie-session');
var Promise = require('bluebird');

var app = express();

app.set('trust proxy', 1) // trust first proxy

app.use(cookieSession({
	name: 'session',
	keys: [config.session.key1, config.session.key2]
}));

app.locals.rootUrl = config.rootUrl;
app.locals.appId = config.facebook.appId;

if (!config.facebook.appId || !config.facebook.appSecret) {
	throw new Error('facebook appId and appSecret required in config.js');
}

passport.use(new FacebookStrategy({
		clientID: config.facebook.appId,
		clientSecret: config.facebook.appSecret,
		callbackURL: config.facebook.redirectUri,
		profileFields: ['id', 'displayName', 'gender', 'devices'],
		passReqToCallback: true
	},
	function(req, accessToken, refreshToken, profile, done) {
		process.nextTick(function() {
			home.authMiddleware(profile._json, req, function() {
				return done();
			});
		});
	}
));

app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());
app.engine('ejs', ejs);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(serveStatic('public'));

app.get('/', function(req, res) {
	if (!(req.session.fbid > 0)) {
		// not logged in
		return res.render('guest');
	} else if (!req.session.sid) {
		return res.render('register');
	}
	var junior_sid = 'b04' + req.session.sid.substr(3, 9).toUpperCase();
	models.Junior.findOne({
		sid: junior_sid
	}, function(err, junior) {
		if (err) {
			console.error(err);
			return res.status(500).json({
				msg: 'error'
			});
		}
		res.render('junior', {
			junior: junior
		});
	});
});
app.post('/', function(req, res) {
	if (!req.session.fbid) {
		return res.status(403).json({
			msg: 'Forbidden'
		});
	}
	if (!req.body.sid || !req.body.auth || req.session.sid) {
		return res.status(400).json({
			msg: 'Bad Request'
		});
	}
	var sid_regex = /^[0-9ab]+$/;
	var sid = req.body.sid.toLowerCase();
	if (!sid_regex.test(sid) || sid.length !== 9) {
		return res.status(400).json({
			msg: 'Bad Request'
		});
	}
	if (req.body.auth == 1) {
		if (!req.body.password) {
			return res.status(400).json({
				msg: 'Bad Request'
			});
		}
		lib.auth_sso(req.body.sid, req.body.password, req.headers["x-forwarded-for"] || req.connection.remoteAddress).then(function() {
			// auth_sso success
			models.User.findOneAndUpdate({
				fbid: req.session.fbid
			}, {
				$set: {
					sid: sid
				}
			}, {
				upsert: true,
				"new": false
			}).exec(function(err, user) {
				if (err) {
					console.error(err);
					return res.status(500).json({
						msg: 'Error'
					});
				}
				req.session.sid = sid;
				res.json({
					msg: 'Success',
					redirect: '/'
				});
			});
		}).catch(function(e) {
			console.error(e);
			return res.status(400).json({
				msg: 'SSO auth error'
			});
		});
	} else if (req.body.auth == 2) {
		var code = Math.random().toString(36).substr(2);
		new Promise.all([
			new Promise(function(resolve, reject) {
				models.User.findOneAndUpdate({
					fbid: req.session.fbid,
					sid: ''
				}, {
					$set: {
						code: code,
						sid_pending: sid
					}
				}, {
					upsert: true,
					"new": false
				}).exec(function(err, user) {
					if (err) {
						reject(err)
					}
					resolve();
				});
			}),
			lib.auth_mail(sid, code)
		]).then(function() {
			res.json({
				msg: 'Success',
				redirect: '/confirm'
			});
		}).error(function(err) {
			console.error(err);
			res.status(500).json({
				msg: ''
			})
		});
	} else {
		return res.status(400).json({
			msg: 'Bad Request'
		});
	}
});

app.get('/login',
	passport.authenticate('facebook'),
	function(req, res) {
		// The request will be redirected to Facebook for authentication, so this
		// function will not be called.
	});
app.get('/login_callback',
	passport.authenticate('facebook', {
		successRedirect: '/',
		failureRedirect: '/'
	}),
	function(req, res) {
		res.redirect('/');
	});
app.get('/shared', function(req, res) {
	if (!req.session.fbid) {
		return res.status(400).json({
			msg: 'error'
		});
	}
	var post_data = [];
	if (!req.query.post_id) {
		// failed share
		post_data = [req.session.fbid, '0'];
	} else {
		post_data = req.query.post_id.split('_');
	}
	if (post_data[0] !== req.session.fbid) {
		return res.status(403).json({
			msg: 'error'
		});
	}
	var share = new models.Share({
		fb_id: post_data[0],
		post_id: post_data[1]
	});
	share.save(function(err) {
		if (err) {
			console.log(err);
		}
		res.render('shared', {
			success: post_data[1] == 0 ? false : true
		});
	});
});
app.get('/confirm', function(req, res) {
	res.render('confirm');
});
app.get('/confirm/:sid/:code', function(req, res) {
	if (!req.params.code || !req.params.sid || !req.session.fbid) {
		return res.status(400).json({
			msg: 'Please login first'
		});
	}
	var sid_regex = /^[0-9ab]+$/;
	var sid = req.params.sid.toLowerCase();
	if (!sid_regex.test(sid) || sid.length !== 9) {
		return res.status(400).json({
			msg: 'Bad Request'
		});
	}

	models.User.findOne({
		sid: '',
		sid_pending: sid,
		code: req.params.code
	}, function(err, user) {
		if (err || !user) {
			return res.status(400).json({
				msg: 'Bad Request'
			});
		}
		models.User.findOneAndUpdate({
			_id: user._id
		}, {
			$set: {
				sid: sid
			}
		}, {
			upsert: true,
			"new": false
		}).exec(function(err, user) {
			if (err) {
				console.error(err);
				return res.status(500).json({
					msg: 'Error'
				});
			}
			req.session.sid = sid;
			res.redirect('/');
		});

	});
});
app.get('/logout', function(req, res) {
	req.session = null;
	res.redirect('/');
});

var server = app.listen(process.env.PORT || 3004, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('App listening at http://%s:%s', host, port);
});