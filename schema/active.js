<<<<<<< HEAD
var constants = require ('../constants')
    , mongoose = require('mongoose')
    , Schema = mongoose.Schema;
=======
var mongoose = require('mongoose')
  , constants = require('../constants')

var Schema = mongoose.Schema;
>>>>>>> 21af3d5fcb7d80f8952eb8176f6a020c5edc3e9a

var ActiveConnection = new Schema({
    userId: {type: Schema.ObjectId, required: true, index : true}
  , lastPoll: {type: Date, default : Date.now}
  , nodeId : {type : String, index : true}  // uniquely identifies which node process is handling the connection
});

ActiveConnection.index({ lastPoll: 1}, {expireAfterSeconds : constants.ACTIVE_CONNECTION_TTL });

mongoose.model('ActiveConnection', ActiveConnection);