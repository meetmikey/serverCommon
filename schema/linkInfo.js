var mongoose = require ('mongoose')
var Schema = mongoose.Schema;
var indexStateSchema = require ('./indexState').indexStateSchema;

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
  , followType: {type: String, enum: ['fail', 'diffbot', 'pdf', 'googleDoc', 'direct', 'ignore']}
  , imageFollowFailed : {type : Boolean}
  , isBadDomain: {type : Boolean}
  , followJobCreated: {type: Boolean}
  , origImageUrl : {type : String}
  , timestamp: {type: Date, default: Date.now}
  , index : {type : [indexStateSchema], default :[]}
});

mongoose.model('LinkInfo', LinkInfo);
exports.LinkInfoModel = mongoose.model('LinkInfo');