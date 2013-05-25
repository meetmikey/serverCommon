var mongoose = require('mongoose'),
    crypto   = require ('crypto'),
    conf     = require ('../conf'),
    constants = require ('../constants'),
    Schema   = mongoose.Schema;

var cryptoSecret = conf.crypto.aesSecret;

// aggregate counts of user sharing can be kept here
var userShare = {
  twitCount : {type : Number, default : 0},
  fbCount : {type : Number, default : 0},
  emCount : {type : Number, default : 0},
  baseDays : {type : Number, default : constants.BASE_DAYS_LIMIT}
};

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
  invalidToken : {type : Boolean, default : false},
  deleteRequest : {type : Boolean}, // the user has requested we delete their account
  timestamp: {type: Date, default: Date.now},
  minProcessedDate : {type : Date, default : Date.now}, // the date of the earliest mail we've processed (according to mikeymail)
  minMailDate : {type : Date}, // the date of the earliest mail in the gmail account
  daysLimit : {type : Number, default : constants.BASE_DAYS_LIMIT}, // how many days the user is entitled to
  isPremium : {type : Boolean, default : false}, // flag to "ignore" the daysLimit in the account entirely
  shares : userShare // aggregated share data
});


// virtual fields for specialized links
User.virtual ('twitRefLink')
  .get (function () {
    return 'https://api.meetmikey.com/refer?token=' + this._id + '&source=twit';
  });

User.virtual ('fbRefLink')
  .get (function () {
    return 'https://api.meetmikey.com/refer?token=' + this._id + '&source=fb';
  });

User.virtual ('emRefLink')
  .get (function () {
    return 'https://api.meetmikey.com/refer?token=' + this._id + '&source=em';
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