var constants = require ('../constants')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema

var UserAction = new Schema({
    userId: {type: Schema.ObjectId, required: true}
  , action: {type : String, enum: ['favorite', 'like'], required: true}
  , resourceId: {type: Schema.ObjectId, required: true}
  , resourceType: {type : String, enum: ['attachment', 'link'], required: true},
});

UserAction.index( {userId: 1, action: 1, resourceId: 1, resourceType: 1}, {unique: true} );

mongoose.model('UserAction', UserAction);
exports.UserActionModel = mongoose.model('UserAction');