var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var LinkDomainResult = new Schema({
    domain: {type: String, required: true}
  , successCount: {type: Number}
  , failCount: {type: Number}
});

LinkDomainResult.index({domain: 1}, {unique: true});

mongoose.model('LinkDomainResult', LinkDomainResult);
exports.LinkDomainResultModel = mongoose.model('LinkDomainResult');