var config = {};

config.rootUrl = process.env.ROOT_URL;

config.facebook = {
	appId: process.env.FACEBOOK_APPID,
	appSecret: process.env.FACEBOOK_APPSECRET,
	appNamespace: process.env.FACEBOOK_APPNAMESPACE,
	redirectUri: process.env.FACEBOOK_REDIRECTURI || config.rootUrl + 'login_callback'
}

config.session = {
	key1: process.env.SESSION_KEY_1,
	key2: process.env.SESSION_KEY_2
}

config.auth = {
	home: process.env.AUTH_HOME,
	login: process.env.AUTH_LOGIN
}

config.mailgun = {
	key: process.env.MAILGUN_KEY,
	domain: process.env.MAILGUN_DOMAIN
}

config.hash_salt = process.env.HASH_SALT;

module.exports = config;