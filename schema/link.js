var mongoose = require ('mongoose')
var Schema = mongoose.Schema;

var EmailUserSchema = new Schema({
    name: {type: String}
  , email: {type: String}
});

var EmailUser = {
    name: {type: String}
  , email: {type: String}
};

var Link = new Schema({
    userId: {type: Schema.ObjectId, index: true, required: true}
  , mailId: {type: Schema.ObjectId, index: true, required: true}
  , linkInfoId: {type: Schema.ObjectId}
  , url: {type: String, required: true}
  , comparableURLHash: {type: String, required: true}
  , isPromoted: {type: Boolean, default: false}
  , image: {type: String}
  , title: {type: String}
  , text: {type: String}
  , sentDate: {type: Date, default: Date.now}
  , sender: EmailUser
  , recipients: {type: [EmailUserSchema]}
  , mailCleanSubject: {type: String}
  , mailBodyText: {type: String}
  , mailBodyHTML: {type: String}
  , gmThreadId: {type: String}
  , timestamp: {type: Date, default: Date.now}
});

Link.index({ userId: 1, gmThreadId: 1 });
Link.index({ userId: 1, isPromoted: 1 });

mongoose.model('Link', Link);
exports.LinkModel = mongoose.model('Link')