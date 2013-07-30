var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var headerBatch = new Schema ({
  minUid : Number,
  maxUid : Number,
  numMails : Number
});

var UserOnboardingState = new Schema({
  userId : {type : Schema.ObjectId, index : true},
  lastCompleted : {type : String},
  headerBatchesComplete : {type : [headerBatch]},
  bandwith : {type : Number, default : 0},
  errorMsg : {type : String},
  hasError : {type : Boolean, default : false},
  mikeyMailTS : {type : Date, default : Date.now}, // the last time a mailDownload daemon indicated it's still working on the download
  nodeId : {type : String, index : true}  // uniquely identifies which node process is handling the connection
})

mongoose.model('UserOnboardingState', UserOnboardingState);
exports.UserOnboardingStateModel = mongoose.model('UserOnboardingState');

var ResumeDownloadState = new Schema({
  userId: {type: Schema.ObjectId, index: true},
  mailBoxId: {type: Schema.ObjectId},
  resumeAt : {type : Date},
  maxUid : {type: Number}, // uid of the most recent mail object when initial onboarding commenced
  headerBatchesComplete : {type : [headerBatch]},
  maxDate : {type : Date, default : Date.now()}, // the date to start at
  minDate : {type : Date}, // the date to end at
  isPremium : {type : Boolean},
  lastCompleted : {type : String},
  bandwith : {type : Number, default : 0},
  mikeyMailTS : {type : Date},
  disabled : {type : Boolean, default : false}, // don't try this again
  nodeId : {type : String} 
});

ResumeDownloadState.index ({mikeyMailTS : 1, resumeAt : 1, lastCompleted : 1, disabled : 1});

mongoose.model ('ResumeDownloadState', ResumeDownloadState);
exports.ResumeDownloadStateModel = mongoose.model('ResumeDownloadState');