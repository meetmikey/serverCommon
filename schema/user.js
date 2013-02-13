var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var User = new Schema({
  googleID: {type: String, index: true},
  accessToken: {type: String},
  refreshToken: {type: String},
  expiresAt: {type: Date },
  displayName: {type: String},
  firstName: {type: String},
  lastName: {type: String},
  email: {type: String, index: true},
  gender: {type: String},
  locale: {type: String},
  hostedDomain: {type: String},
  gmailScrapeRequested : {type : Boolean, default: false},
  timestamp: {type: Date, 'default': Date.now}
});

var UserOnboardingState = new Schema({
  userId : {type : Schema.ObjectId, index : true},
  lastCompleted : {type : String,
    enum : ['gmailScrapeDequeued',
            'createMailbox',
            'retrieveHeaders',
            'createTempDirectoryForEmails',
            'retrieveAttachments',
            'retrieveEmailsNoAttachments',
            'markStoppingPoint',
            'closeMailbox']},
  errorMsg : {type : String},
  hasError : {type : Boolean, default : false}
})

mongoose.model('User', User);
mongoose.model ('UserOnboardingState', UserOnboardingState);
module.exports = mongoose.model('User');
