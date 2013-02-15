var mongoose = require ('mongoose')
var Schema = mongoose.Schema;

var LinkInfo = new Schema({
    comparableURLHash: {type: String, index: true, required: true}
  , rawURL: {type: String, required: true}
  , comparableURL: {type: String, required: true}
  , resolvedURL: {type: String}
  , diffbotResponse: {}
  , lastDiffbotDate: {type: Date}
  , image: {type: String}
  , title: {type: String}
  , text: {type: String}
  , lastFollowDate: {type: Date}
  , timestamp: {type: Date, default: Date.now}
});

mongoose.model('LinkInfo', LinkInfo);
exports.LinkInfoModel = mongoose.model('LinkInfo');