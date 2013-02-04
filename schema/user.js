var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;


var User = new Schema({
  googleID: {type: String, index: true},
  accessToken: {type: String},
  refreshToken: {type: String},
  displayName: {type: String},
  firstName: {type: String},
  lastName: {type: String},
  email: {type: String, index: true},
  gender: {type: String},
  locale: {type: String},
  hostedDomain: {type: String},
  gmailScrapeRequested : {type : Boolean, default: false},
  attachmentsExtracted : {type : Boolean, default : false},
  linksExtracted : {type : Boolean, default : false},
  timestamp: {type: Date, 'default': Date.now}
});

mongoose.model('User', User);
module.exports = mongoose.model('User');
