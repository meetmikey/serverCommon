var mongoose = require ('mongoose')
var Schema = mongoose.Schema;
var indexStateSchema = require ('./indexState').indexStateSchema;

var AttachmentInfo = new Schema({
    contentType: {type: String}
  , fileSize: {type: Number}
  , isImage: {type: Boolean, index : true}
  , attachmentThumbExists : {type : Boolean}
  , attachmentThumbSkip : {type : Boolean} // true if we should skip thumbnailing b/c attachment is already small
  , attachmentThumbErr : {type : Boolean} // true if there was an error trying to process an image attachment
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
  , hash: {type: String, required: true}
  , index : indexStateSchema
  , timestamp: {type: Date, default: Date.now}
});


AttachmentInfo.index({ userId: 1, gmThreadId: 1 });
AttachmentInfo.index({ hash: 1, fileSize: 1 }, {unique : true});
AttachmentInfo.index({ userId: 1, isImage: 1, sentDate: -1 });


mongoose.model('AttachmentInfo', AttachmentInfo);
exports.AttachmentInfoModel = mongoose.model('AttachmentInfo');