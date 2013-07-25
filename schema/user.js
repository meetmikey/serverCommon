var mongoose = require('mongoose'),
    crypto   = require ('crypto'),
    conf     = require ('../conf'),
    bases     = require ('bases'),
    constants = require ('../constants'),
    CounterModel = require ('./counter').CounterModel,
    Schema   = mongoose.Schema;

var cryptoSecret = conf.crypto.aesSecret;

var schemaOptions = {
  toJSON: {
    virtuals: true
  }
};

var User = new Schema({
  shortId : {type : String, index : true},
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
  minMRProcessedDate : {type : Date, default : Date.now}, // the date of the earliest mail that has been processed (according to mailreader)
  minMailDate : {type : Date}, // the date of the earliest mail in the gmail account
  daysLimit : {type : Number, default : constants.BASE_DAYS_LIMIT}, // how many days the user is entitled to
  isPremium : {type : Boolean, default : false}, // flag to "ignore" the daysLimit in the account entirely
  allMailError : {type : Boolean},
  stripeCustomerId: {type: String},
  billingPlan: {type: String, enum: ['free', 'basic', 'pro']},
  billingPlanStartDate: {type: Date}
}, schemaOptions );

// virtual fields for specialized links
var baseReferralURL = constants.BASE_REFERRAL_URL;

User.virtual ('twitterReferralLink')
  .get (function () {
    return baseReferralURL + '/' + this.shortId + '/' + constants.REFERRAL_SOURCE_TWITTER;
  });

User.virtual ('facebookReferralLink')
  .get (function () {
    return baseReferralURL + '/' + this.shortId + '/' + constants.REFERRAL_SOURCE_FACEBOOK;
  });

User.virtual ('directReferralLink')
  .get (function () {
    return baseReferralURL + '/' + this.shortId + '/' + constants.REFERRAL_SOURCE_DIRECT;
  });

// create a shortId
User.pre ('save', function (next) {
  var self = this;
  if (!this.shortId) {
    CounterModel.findOneAndUpdate ({model : 'user'}, 
      {$inc : {count : 1}}, 
      {new : true, upsert : true}, 
      function (err, doc) {
        if (err) {return next (err); }
        self.shortId = String(bases.toBase36(doc.count));
        next ();
      });
  } 
  else {
    next();
  }
});


User.virtual('refreshToken')
  .get(function () {
    if ( ! this.symHash ) {
      return null;
    }
    var decipher = crypto.createDecipher(conf.crypto.scheme, cryptoSecret);
    var tokenAndSalt = decipher.update(this.symHash, 'hex', 'utf8');
    tokenAndSalt += decipher.final ('utf8');
    var saltLen = this.symSalt.length;
    var token = tokenAndSalt.substring (saltLen, tokenAndSalt.length);
    return token;
  })
  .set (function (refreshToken) {
    if ( refreshToken ) {
      var cipher = crypto.createCipher(conf.crypto.scheme, cryptoSecret);
      this.symSalt = crypto.randomBytes (8).toString ('hex');
      var symmetricHash = cipher.update (this.symSalt + refreshToken, 'utf8', 'hex');
      symmetricHash += cipher.final ('hex');
      this.symHash = symmetricHash;
    }
  });

User.virtual('accessToken')
  .get (function () {
    if ( ! this.accessHash ) {
      return null;
    }
    var decipher = crypto.createDecipher(conf.crypto.scheme, cryptoSecret);
    var token = decipher.update (this.accessHash, 'hex', 'utf8');
    token += decipher.final ('utf8');
    return token;
  })
  .set (function (accessToken) {
    if ( ! accessToken ) {
      return;
    }
    var cipher = crypto.createCipher(conf.crypto.scheme, cryptoSecret);
    var hashToken = cipher.update (accessToken, 'utf8', 'hex');
    hashToken += cipher.final('hex');
    this.accessHash = hashToken;
  });


mongoose.model('User', User);
exports.UserModel = mongoose.model('User');
