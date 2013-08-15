var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var ReceiveMR = new Schema ({
  _id : {
      userId : {type: Schema.ObjectId}
    , email: {type: String}
  },
  value : {type: Number}
})

var SentAndCoReceiveMR = new Schema ({
  _id : {
      userId : {type: Schema.ObjectId}
    , email: {type: String}
  },
  value : {
    sent : {type : Number},
    corecipient : {type : Number}
  }
})


ReceiveMR.index({ "_id.userId": 1, "_id.email": 1 }, {unique : true});
SentAndCoReceiveMR.index({ "_id.userId": 1, "_id.email": 1 }, {unique : true});

mongoose.model('ReceiveMR', ReceiveMR);
exports.ReceiveMRModel = mongoose.model('ReceiveMR');

mongoose.model('SentAndCoReceiveMR', SentAndCoReceiveMR);
exports.SentAndCoReceiveMRModel = mongoose.model('SentAndCoReceiveMR');