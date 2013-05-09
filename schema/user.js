var mongoose = require('mongoose'),
    crypto   = require ('crypto'),
    conf     = require ('../conf'),
    Schema   = mongoose.Schema;

var cryptoSecret = conf.crypto.aesSecret;

var User = new Schema({
  googleID: {type: String, index: true},
  accessHash : {type : String},
  symHash : {type : String},
  symSalt : {type : String},
  asymHash : {type : String},
  asymSalt : {type : String},
  expiresAt: {type: Date },
  displayName: {type: String},
  firstName: {type: String},
  lastName: {type: String},
  email: {type: String, unique: true, lowercase: true},
  gender: {type: String},
  locale: {type: String},
  hostedDomain: {type: String},
  picture: {type: String},
  gmailScrapeRequested : {type : Boolean, default: false},
  timestamp: {type: Date, 'default': Date.now}
});


User.virtual('refreshToken')
  .get(function () {
    var decipher = crypto.createDecipher(conf.crypto.scheme, cryptoSecret);
    var tokenAndSalt = decipher.update(this.symHash, 'hex', 'utf8');
    tokenAndSalt += decipher.final ('utf8');
    var saltLen = this.symSalt.length;
    var token = tokenAndSalt.substring (saltLen, tokenAndSalt.length);
    return token;
  })
  .set (function (refreshToken) {
    var cipher = crypto.createCipher(conf.crypto.scheme, cryptoSecret);
    this.symSalt = crypto.randomBytes (8).toString ('hex');
    var symmetricHash = cipher.update (this.symSalt + refreshToken, 'utf8', 'hex');
    symmetricHash += cipher.final ('hex');
    this.symHash = symmetricHash;
  });

User.virtual('accessToken')
  .get (function () {
    var decipher = crypto.createDecipher(conf.crypto.scheme, cryptoSecret);
    var token = decipher.update (this.accessHash, 'hex', 'utf8');
    token += decipher.final ('utf8');
    return token;
  })
  .set (function (accessToken) {
    var cipher = crypto.createCipher(conf.crypto.scheme, cryptoSecret);
    var hashToken = cipher.update (accessToken, 'utf8', 'hex');
    hashToken += cipher.final('hex');
    this.accessHash = hashToken;
  });

mongoose.model('User', User);
exports.UserModel = mongoose.model('User');