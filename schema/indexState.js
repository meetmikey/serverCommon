var indexStateSchema = {
  indexState : {type : String, enum : ['done', 'softFail', 'hardFail'], index : true}
  , indexError : {type : String}
  , tries : {type : Number, default : 0}
  , version : {type : Number}
};


exports.indexStateSchema = indexStateSchema;