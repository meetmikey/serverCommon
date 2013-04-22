var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var indexStateSchema = new Schema ({
  indexState : {type : String, enum : ['done', 'softFail', 'hardFail'], index : true}
  , tries : {type : Number, default : 0}
  , version : {type : String}
  , asStub : {type : Boolean} // after a number of failed indexing attempts we may keep a stub resource...
});


exports.indexStateSchema = indexStateSchema;