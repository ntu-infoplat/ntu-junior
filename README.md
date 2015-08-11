台大找直屬
====================
台大找直屬是一個協助學長姐找到 B04 直屬的一個小工具
採用 Facebook 登入，並有學號驗證的機制

## Getting Started

本程式使用 Node.js + Express 4 + mongoDB 寫成
欲運行，請確認已安裝相關平台的 Node.js, npm, mongoDB

    # 使用 npm 安裝相依套件
    npm install

設定相關環境變數，示例如下

    ROOT_URL=網站的網址
    FACEBOOK_APPID=Facebook App ID
    FACEBOOK_APPSECRET=Facebook App Secret
    FACEBOOK_APPNAMESPACE=Facebook App Namespace
    FACEBOOK_REDIRECTURI=Facebook login callback，通常為網址後面加/login_callback
    AUTH_HOME=學號認證用後端網站
    AUTH_LOGIN=學號認證用登入網址
    SESSION_KEY_1=Cookie Session Key 1
    SESSION_KEY_2=Cookie Session Key 2
    MAILGUN_DOMAIN=mailgun 寄信的網域
    MAILGUN_KEY=mailgun 寄信的 key

環境變數可放置於 **local.env**，即可配合 foreman 協助設定
並使用 **npm run start-dev** 執行

## Credits
 - [Shouko](https://github.com/shouko)

## License
 MIT License
