var indexStateSchema = {
  indexState : {type : String, enum : ['done', 'softFail', 'hardFail'], index : true}
  , indexError : {type : String}
  , tries : {type : Number, default : 0}
  , version : {type : String}
  , asStub : {type : Boolean} // after a number of failed indexing attempts we may keep a stub resource in the index with whatever info we could extract
};


exports.indexStateSchema = indexStateSchema;