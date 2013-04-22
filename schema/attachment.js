var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var indexStateSchema = require ('./indexState').indexStateSchema;

var EmailUserSchema = new Schema({
    name: {type: String}
  , email: {type: String}
});

var EmailUser = {
    name: {type: String}
  , email: {type: String}
};

var Attachment = new Schema({
    userId: {type: Schema.ObjectId, required: true}
  , mailId: {type: Schema.ObjectId, index: true, required: true}
  , filename: {type: String}
  , contentType: {type: String}
  , fileSize: {type: Number}
  , sentDate: {type: Date, default: Date.now}
  , sender: EmailUser
  , recipients: {type: [EmailUserSchema]}
  , isImage: {type: Boolean, index : true}
  , attachmentThumbExists : {type : Boolean}
  , docType : {type : String, enum : ['image', 
                                      'pdf',
                                      'photoshop',
                                      'presentation', 
                                      'spreadsheet', 
                                      'document', 
                                      'music', 
                                      'video',
                                      'code',
                                      'archive',
                                      'other']}
  , mailCleanSubject: {type: String}
  , mailBodyText: {type: String}
  , mailBodyHTML: {type: String}
  , hash: {type: String, required: true}
  , gmThreadId: {type: String}
  , gmMsgId : {type : String}
  , gmMsgHex : {type : String}
  , index : {type : [indexStateSchema], default :[]}
  , isPromoted: {type : Boolean}
  , isDeleted: {type : Boolean}
  , image: {type: String} // dummy used by API for signedURL
  , timestamp: {type: Date, default: Date.now}
});

Attachment.index({ userId: 1, gmThreadId: 1, hash : 1, fileSize : 1 }, {unique : true});
Attachment.index ({userId : 1, hash : 1});
Attachment.index({ userId: 1, isPromoted: 1, isImage: 1, sentDate: -1 });
Attachment.index({ hash: 1, fileSize: 1 });

mongoose.model('Attachment', Attachment);
exports.AttachmentModel = mongoose.model('Attachment');
