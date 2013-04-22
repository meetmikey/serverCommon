var mongoose = require ('mongoose');
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

var Link = new Schema({
    userId: {type: Schema.ObjectId, required: true}
  , mailId: {type: Schema.ObjectId, index: true, required: true}
  , linkInfoId: {type: Schema.ObjectId}
  , url: {type: String, required: true}
  , resolvedURL: {type: String}
  , comparableURLHash: {type: String, index : true, required: true}
  , isPromoted: {type: Boolean, index: true}
  , isFollowed: {type: Boolean}
  , nonPromotableReason: {type: String, enum: ['invalid', 'sender', 'text', 'duplicates', 'followFail']}
  , image: {type: String}
  , imageThumbExists : {type : Boolean}
  , title: {type: String}
  , summary: {type: String}
  , sentDate: {type: Date, default: Date.now}
  , sender: EmailUser
  , recipients: {type: [EmailUserSchema]}
  , mailCleanSubject: {type: String}
  , mailBodyText: {type: String}
  , mailBodyHTML: {type: String}
  , gmThreadId: {type: String}
  , gmMsgId : {type : String}
  , gmMsgHex : {type : String}
  , index : {type : [indexStateSchema], default :[]}
  , timestamp: {type: Date, default: Date.now}
  , isDeleted : {type : Boolean}
});

Link.index({ userId: 1, gmThreadId: 1, comparableURLHash : 1 }, {unique : true});
Link.index({ userId: 1, comparableURLHash : 1});
Link.index({ userId: 1, isPromoted: 1, isFollowed: 1, sentDate : -1});
Link.index({ userId: 1, isPromoted: 1, isFollowed: 1, comparableURLHash : 1});

mongoose.model('Link', Link);
exports.LinkModel = mongoose.model('Link');