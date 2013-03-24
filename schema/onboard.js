var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var headerBatch = new Schema ({
  minUid : Number,
  maxUid : Number,
  numMails : Number
});

var UserOnboardingState = new Schema({
  userId : {type : Schema.ObjectId, index : true},
  lastCompleted : {type : String,
    enum : ['gmailScrapeDequeued',
            'createOrLookupMailbox',
            'retrieveHeadersInBatch',
            'mapReduceContacts',
            'mapReduceReceiveCounts',
            'createTempDirectoryForEmails',
            'markMarketingFromEmails',
            'markMarketingTextEmails',
            'retrieveAttachments',
            'retrieveEmailsNoAttachments',
            'retrieveEmails',
            'markStoppingPoint']},
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
  resumeAt : {type : Date, index : true},
  maxUid : {type: Number}, // uid of the most recent mail object when initial onboarding commenced
  lastCompleted : {type : String,
    enum : ['lookupMailbox',
            'createTempDirectoryForEmails',
            'retrieveAttachments',
            'retrieveEmailsNoAttachments',
            'retrieveEmails',
            'markStoppingPoint']},
  bandwith : {type : Number, default : 0},
  mikeyMailTS : {type : Date},
  nodeId : {type : String, index : true}  // uniquely identifies which node process is handling the connection
});

mongoose.model ('ResumeDownloadState', ResumeDownloadState);
exports.ResumeDownloadStateModel = mongoose.model('ResumeDownloadState');
