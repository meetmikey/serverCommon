var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var UserOnboardingState = new Schema({
  userId : {type : Schema.ObjectId, index : true},
  lastCompleted : {type : String,
    enum : ['gmailScrapeDequeued',
            'createMailbox',
            'retrieveHeaders',
            'createTempDirectoryForEmails',
            'retrieveAttachments',
            'retrieveEmailsNoAttachments',
            'markStoppingPoint']},
  errorMsg : {type : String},
  hasError : {type : Boolean, default : false}
})

mongoose.model('UserOnboardingState', UserOnboardingState);

var ResumeDownloadState = new Schema({
  userId: {type: Schema.ObjectId, index: true},
  mailBoxId: {type: Schema.ObjectId},
  resumeAt : {type : Date, index : true},
  maxUid : {type: Number}, // uid of the most recent mail object when initial onboarding commenced
  lastCompleted : {type : String,
    enum : ['lookupMailbox',
            'createTempDirectoryForEmails',
            'retrieveAttachments',
            'retrieveEmailsNoAttachments',
            'markStoppingPoint']},
  errorMsg : {type : String},
  hasError : {type : Boolean, default : false},
  claimed : {type : Boolean, default : false}
});

mongoose.model ('ResumeDownloadState', ResumeDownloadState)
