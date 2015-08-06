var models = require('../models');

exports.authMiddleware = function(profile, req, callback) {
  var User = models.User;
  User.findOne({
    fbid: profile.id
  }, function(err, result) {
    if (err) {
      throw err;
    }
    if (!result) {
      var user = new User({
        fbid: profile.id,
        name: profile.name,
        gender: profile.gender,
        ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress
      });
      user.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('new user:', profile);
          callback();
        }
      });
    } else {
      console.log('returning user:', profile.id);
      req.session.sid = result.sid;
      callback();
    }
  });
  req.session.fbid = profile.id;
  req.session.name = profile.name;
}