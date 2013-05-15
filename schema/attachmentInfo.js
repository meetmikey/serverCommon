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
  , isUploaded: {type: Boolean}
  , index : {type : [indexStateSchema], default :[]}
  , timestamp: {type: Date, default: Date.now}
});

AttachmentInfo.index({ hash: 1, fileSize: 1 }, {unique : true});

mongoose.model('AttachmentInfo', AttachmentInfo);
exports.AttachmentInfoModel = mongoose.model('AttachmentInfo');