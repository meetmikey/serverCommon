var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;


var User = new Schema({
  googleID: {type: String, index: true},
  accessToken: {type: String},
  refreshToken: {type: String},
  displayName: {type: String},
  firstName: {type: String},
  lastName: {type: String},
  email: {type: String},
  gender: {type: String},
  locale: {type: String},
  hostedDomain: {type: String},
  timestamp: {type: Date, 'default': Date.now}
});

mongoose.model('User', User);
module.exports = mongoose.model('User');
