var constants = require ('../constants')
    , mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var ActiveConnection = new Schema({
    _id: {type: Schema.ObjectId}
  , lastPoll: {type: Date, default : Date.now}
  , nodeId : {type : String, index : true}  // uniquely identifies which node process is handling the connection
});

ActiveConnection.index({ lastPoll: 1}, {expireAfterSeconds : constants.ACTIVE_CONNECTION_TTL });

mongoose.model('ActiveConnection', ActiveConnection);