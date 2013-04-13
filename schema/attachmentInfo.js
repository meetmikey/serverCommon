var mongoose = require ('mongoose')
var Schema = mongoose.Schema;

var AttachmentInfo = new Schema({
    contentType: {type: String}
  , fileSize: {type: Number}
  , isImage: {type: Boolean, index : true}
  , attachmentThumbExists : {type : Boolean}
  , attachmentThumbSkip : {type : Boolean} // true if we should skip thumbnailing b/c attachment is already small
  , attachmentThumbErr : {type : Boolean} // true if there was an error trying to process an image attachment
  , docType : {type : String, enum : ['image', 
                                      'pdf', 
                                      'presentation', 
                                      'spreadsheet', 
                                      'document', 
                                      'music', 
                                      'video',
                                      'code',
                                      'archive',
                                      'other']}
  , hash: {type: String, required: true}
  , indexState : {type : String, enum : ['done', 'softFail', 'hardFail']}
  , indexError : {type : String}
  , timestamp: {type: Date, default: Date.now}
}, {
  shardKey: {
    comparableURLHash: 1
  }
});

mongoose.model('AttachmentInfo', AttachmentInfo);
exports.AttachmentInfoModel = mongoose.model('AttachmentInfo');