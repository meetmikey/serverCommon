var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EmailUserSchema = new Schema({
    name: {type: String}
  , email: {type: String}
});

var EmailUser = {
    name: {type: String}
  , email: {type: String}
};

var ContactData = {
    sent: {type: Number}
  , corecipient: {type: Number}
}

var Mail = new Schema({
    userId: {type: Schema.ObjectId, required: true}
  , messageId: {type: String}
  , sender: EmailUser
  , recipients: {type: [EmailUserSchema]}
  , subject: {type: String}
  , cleanSubject: {type: String}
  , bodyText: {type: String}
  , bodyHTML: {type: String}
  , numAttachments: {type: Number}
  , sentDate: {type: Date, required : true}
  , timestamp: {type: Date, default: Date.now}
  , uid : {type : Number, required : true}
  , seqNo : {type : Number}
  , mailboxId : {type : Schema.ObjectId}
  , s3Path : {type : String}
  , mmDone : {type : Boolean}
  , failUpload : {type : Boolean}
  , bodyInS3 : {type : String, enum : ['success', 'fail']}
  , size : {type : Number}
  , mailReaderState: {type: String, enum: ['started', 'softFail', 'hardFail', 'done']}
  , linkExtractorState: {type: String, enum: ['ignored', 'noLinks', 'started', 'done']}
  , gmDate : {type: Date}
  , gmThreadId : {type : String, required : true}
  , gmMsgId : {type : String}
  , gmLabels : {type : [String]}
  , isDeleted : {type : Boolean}
  , hasAttachment : {type : Boolean}
  , hasMarketingFrom : {type : Boolean}
  , hasMarketingText : {type : Boolean}
  , senderContactData: ContactData //dummy val
  , isSentByUser: {type : Boolean} //dummy val
});

// for querying for attachments or no attachments + user and sorting by uid descending
Mail.index({ userId: 1, s3Path : 1, hasAttachment: 1, uid : -1 } );
Mail.index ({userId: 1, s3Path: 1, hasMarketingText : 1, hasMarketingFrom : 1, uid : -1});
Mail.index ({mmDone: 1, mailReaderState: 1});

//db.mails.ensureIndex ({userId : 1, s3Path : 1, hasMarketingText : 1, hasMarketingFrom: 1, uid : -1})

// need an index on... userId, s3Path, hasAttachment, hasMarketingFrom, hasMarketingText, sort uid -1

// For ensuring we don't duplicate in failure state.
Mail.index( {"userId": 1, "uid": 1}, {unique : true} );


var MailBox = new Schema ({
    userId : {type : Schema.ObjectId, unique : true, required : true}
  , uidValidity : {type : Number, required : true}
  , name : {type : String, required : true}
  , uidNext : {type : Number, required : true}
  , totalMessages : {type : Number, required: true}
  , lastUpdate : {type : Date, default : Date.now, index: true}
})

mongoose.model ('MailBox', MailBox)
exports.MailBoxModel = mongoose.model('MailBox');
mongoose.model('Mail', Mail);
exports.MailModel = mongoose.model('Mail');
