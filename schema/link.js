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
  , comparableURLHash: {type: String, required: true}
  , isPromoted: {type: Boolean}
  , isFollowed: {type: Boolean}
  , nonPromotableReason: {type: String, enum: ['invalid', 'sender', 'senderRatio', 'text', 'duplicates', 'followFail', 'regex']}
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
  , isDeleted : {type : Boolean, default : false}
  , isFavorite: {type : Boolean, default : false}
  , isLiked: {type : Boolean, default : false}
  , indexLockTS : {type : Date}
});

Link.index({ comparableURLHash : 1, userId: 1, gmThreadId: 1 }, {unique : true});
Link.index({ userId: 1, isPromoted: 1, isFollowed: 1, isDeleted : 1, isFavorite : 1, sentDate : -1});

mongoose.model('Link', Link);
exports.LinkModel = mongoose.model('Link');


var LinkMr = new Schema ({
  _id : {
    userId:  {type: Schema.ObjectId},
    gmThreadId : {type: String},
    comparableURLHash : {type : String}
  },
  value : {type: Number}
});

mongoose.model('LinkMr', LinkMr);
