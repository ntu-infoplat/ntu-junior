var request = require('request');
var config = require('./config');
var Promise = require('bluebird');
var mailgun = require('mailgun-js')({
	apiKey: config.mailgun.key,
	domain: config.mailgun.domain
});

exports.auth_sso = function(username, password, ip) {
	var j = request.jar();

	var options = {
		url: config.auth.home,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.2309.372 Safari/537.36',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'X-Forwarded-For': ip
		},
		method: 'GET',
		jar: j
	};

	return new Promise(function(resolve, reject) {
		request(options, function(error, response, body) {
			if (error) {
				reject(error);
			}
			resolve();
		})
	}).then(function() {
		options.url = config.auth.login;
		options.method = 'POST';
		options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		options.headers['Referer'] = config.auth.login;
		options.form = {
			username: username + '@ntu.edu.tw',
			password: password,
			vhost: 'standard'
		};
		return new Promise(function(resolve, reject) {
			request(options, function(error, response, body) {
				if (error || response.statusCode != 302) {
					reject('Bad Auth: ' + username + ' ' + password + ' ' + ip);
				}
				resolve();
			});
		})
	});
}

exports.auth_mail = function(username, code) {
	return new Promise(function(resolve, reject) {
		var data = {
			from: '台大找直屬 <ntu-junior@' + config.mailgun.domain + '>',
			to: username + '@ntu.edu.tw',
			subject: '台大找直屬 驗證信',
			html: 'Hi,<br><br>感謝你使用台大找直屬，請點選以下連結以確認你的帳號<br><a href="' + config.rootUrl + 'confirm/' + code + '">' + config.rootUrl + 'confirm/' + code + '</a><br><br>如果你沒有註冊，請忽略此信'
		};

		mailgun.messages().send(data, function(error, body) {
			if (error) {
				return reject(error);
			}
			resolve();
		});
	});
}