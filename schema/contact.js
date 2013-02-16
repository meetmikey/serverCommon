var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var ReceiveMR = new Schema ({
  _id : {
    email: {type: String},
    userId : {type: Schema.ObjectId}
  },
  value : {type: Number}
})

var SentAndCoReceiveMR = new Schema ({
  _id : {
      email: {type: String}
    , userId : {type: Schema.ObjectId}
  },
  value : {
    sent : {type : Number},
    corecipient : {type : Number}
  }
})


ReceiveMR.index({ "_id.email": 1, "_id.userId": 1 }, {unique : true});
SentAndCoReceiveMR.index({ "_id.email": 1, "_id.userId": 1 }, {unique : true});

mongoose.model('ReceiveMR', ReceiveMR);
exports.ReceiveMRModel = mongoose.model('ReceiveMR');

mongoose.model('SentAndCoReceiveMR', SentAndCoReceiveMR);
exports.SentAndCoReceiveMRModel = mongoose.model('SentAndCoReceiveMR');