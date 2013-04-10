var mongoose = require ('mongoose')
var Schema = mongoose.Schema;

var LinkInfo = new Schema({
    comparableURLHash: {type: String, required: true, unique: true}
  , rawURL: {type: String, required: true}
  , comparableURL: {type: String, required: true}
  , resolvedURL: {type: String}
  , image: {type: String} // the preview image
  , imageThumbExists : {type : Boolean}
  , imageThumbErr : {type : Boolean}
  , title: {type: String}
  , summary: {type: String}
  , lastFollowDate: {type: Date}
  , followType: {type: String, enum: ['fail', 'diffbot', 'pdf', 'googleDoc', 'direct']}
  , imageFollowFailed : {type : Boolean, index : true}
  , origImageUrl : {type : String}
  , timestamp: {type: Date, default: Date.now}
  , indexState: {type : String, enum : ['done', 'softFail', 'hardFail']}
  , indexError : {type : String}
}, {
  shardKey: {
    comparableURLHash: 1
  }
});

mongoose.model('LinkInfo', LinkInfo);
exports.LinkInfoModel = mongoose.model('LinkInfo');