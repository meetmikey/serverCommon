var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var QueueFail = new Schema ({
  body : {type : String}
  , queueName : {type : String}
  , timestamp: {type: Date, default: Date.now}
});

mongoose.model('QueueFail', QueueFail);

var QueueFailModel = mongoose.model ('QueueFail');
exports.QueueFailModel = QueueFailModel;