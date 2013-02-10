var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var ResumeDownloading = new Schema({
  userId: {type: Schema.ObjectId, index: true},
  mailBoxId: {type: Schema.ObjectId},
  userOnboardingStateId : {type: Schema.ObjectId},
  resumeDate : {type : Date}
});

mongoose.model ('ResumeDownloading', ResumeDownloading)
