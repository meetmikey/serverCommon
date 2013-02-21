var mongoose = require('mongoose');
  , constants = require('../constants')

var Schema = mongoose.Schema;

var ActiveConnection = new Schema({
    userId: {type: Schema.ObjectId, required: true, index : true}
  , lastPoll: {type: Date, default : Date.now}
  , nodeId : {type : String, index : true}  // uniquely identifies which node process is handling the connection
});

ActiveConnection.index({ lastPoll: 1}, {expireAfterSeconds : constants.ACTIVE_CONNECTION_TTL });

mongoose.model('ActiveConnection', ActiveConnection);