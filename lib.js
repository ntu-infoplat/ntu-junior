var request = require('request');
var config = require('./config');
var Promise = require('bluebird');

exports.auth_sso = function(username, password, ip) {
	var j = request.jar();

	var options = {
		url: config.auth.home,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.2309.372 Safari/537.36',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		},
		method: 'GET',
		jar: j
	};

	return new Promise(function(resolve, reject) {
		request(options, function(error, response, body) {
			if (error) {
				throw new Error(error);
			}
			resolve();
		})
	}).then(function() {
		options.url = config.auth.login;
		options.method = 'POST';
		options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		options.headers['X-Forwarded-For'] = ip;
		options.headers['Referer'] = config.auth.login;
		options.form = {
			username: username + '@ntu.edu.tw',
			password: password,
			vhost: 'standard'
		};
		return new Promise(function(resolve, reject) {
			request(options, function(error, response, body) {
				if (error || response.statusCode != 302) {
					throw new Error(error || 'Bad auth');
				}
				resolve();
			});
		})
	});
}

exports.auth_mail = function(username, code) {
	return new Promise();
}