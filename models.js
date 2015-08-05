var mongoose = require('mongoose');

var uristring =
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/ntujunior';

var connection = mongoose.createConnection(uristring, function(err, res) {
  if (err) {
    console.log('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log('Succeeded connected to: ' + uristring);
  }
});

var User = new mongoose.Schema({
  fbid: {
    type: String,
    index: true
  },
  name: String,
  gender: String,
  sid: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  ip: {
    type: String,
    default: ''
  },
  code: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
});

var Share = new mongoose.Schema({
  fb_id: String,
  post_id: String,
  date: {
    type: Date,
    default: Date.now
  }
});

var Junior = new mongoose.Schema({
  sid: {
    type: String,
    index: true
  },
  dept: String,
  name: String
});

mongoose.model('User', User);
mongoose.model('Share', Share);
mongoose.model('Junior', Junior);

exports.User = connection.model('User');
exports.Share = connection.model('Share');
exports.Junior = connection.model('Junior');