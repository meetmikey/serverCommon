var constants = require ('../constants')
    , mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var ActiveConnection = new Schema({
    _id: {type: Schema.ObjectId} // use userId in this field
  , lastPoll: {type: Date, default : Date.now}
  , mikeyMailTS : {type : Date, default : Date.now} // the last time the mailListen daemon indicated it's still managing this connection
  , nodeId : {type : String, index : true}  // uniquely identifies which node process is handling the connection
});

ActiveConnection.index({ lastPoll: 1}, {expireAfterSeconds : constants.ACTIVE_CONNECTION_TTL });
ActiveConnection.index ({nodeId : 1, _id : 1}) // index on nodeId and _id -> which represents userId

mongoose.model('ActiveConnection', ActiveConnection);