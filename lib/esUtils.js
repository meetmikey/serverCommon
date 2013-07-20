var esConnect = require('./esConnect')
  , constants = require ('../constants')
  , utils = require ('./utils')
  , os = require ('os')
  , sesUtils = require ('./sesUtils')
  , winston = require('./winstonWrapper').winston

var esUtils = this;

exports.ERROR_TYPE_NO_RESPONSE = 'no response';
exports.ERROR_TYPE_BAD_RESPONSE = 'bad response';
exports.ERROR_TYPE_EXCEPTION = 'exception';
exports.ERROR_TYPE_ERROR = 'error';

exports.index = function( index, type, id, data, parentId, callback ) {

  if ( ! index ) { callback( winston.makeMissingParamError('index') ); return; }
  if ( ! type ) { callback( winston.makeMissingParamError('type') ); return; }
  if ( ! id ) { callback( winston.makeMissingParamError('id') ); return; }
  if ( ! data ) { callback( winston.makeMissingParamError('data') ); return; }

  var options = {'id': id};
  if ( parentId ) {
    options['parent'] = parentId;
  }

  var metadata = {
    index : index,
    type : type,
    id : id,
    parentId : parentId
  };

  esConnect.getClient().index( index, type, data, options)
    .on('data', function( responseData ) {
      esUtils.handleResponseData( responseData, metadata, callback );
    })
    .on('error', function( esError ) {
      esUtils.handleError( esError, metadata, callback );
    })
    .exec();
}

exports.get = function( index, type, id, data, callback ) {
  //TODO: write this...
}

exports.delete = function (index, type, id, parentId, callback) {
  utils.runWithRetries (esUtils.deleteNoRetry, constants.ES_RETRIES, callback, index, type, id, parentId);
}

exports.deleteNoRetry = function( index, type, id, parentId, callback ) {

  if ( ! index ) { callback( winston.makeMissingParamError('index') ); return; }
  if ( ! type ) { callback( winston.makeMissingParamError('type') ); return; }
  if ( ! id ) { callback( winston.makeMissingParamError('id') ); return; }

  var options = {};
  if ( parentId ) {
    options['routing'] = parentId;
  }

  var metadata = {
    index : index,
    type : type,
    id : id,
    parentId : parentId
  };

  esConnect.getClient().deleteDocument( index, type, id, options )
    .on( 'data', function( responseData ) {
      esUtils.handleResponseData( responseData, metadata, callback );
    })
    .on( 'error', function( esError ) {
      esUtils.handleError( esError, metadata, callback );
    })
    .exec();
}

exports.search = function (index, type, query, callback) {
  if ( ! index ) { callback( winston.makeMissingParamError('index') ); return; }
  if ( ! query ) { callback( winston.makeMissingParamError('query') ); return; }
  if ( ! type ) { callback( winston.makeMissingParamError('type') ); return; }

  var metadata = {
    index : index,
    type : type
  };

  esConnect.getClient().search (index, type, query)
    .on ( 'data', function (responseData) {
      esUtils.handleResponseData (responseData, metadata, callback);
    })
    .on ('error', function (esError) {
      esUtils.handleError (esError, metadata, callback);
    })
    .exec();

}

exports.createAliasForUser = function (userId, callback) {

  var alias = {
    "actions" : [
      { 
        "add" : { 
          "index" : esConnect.indexName,
          "alias" : esUtils.getIndexAliasForUser (userId),
          "filter" :  {"term" : {"userId" : userId} },
          "routing" : userId
        } 
      }
    ]
  }

  esConnect.getClient().aliases (alias, function (err) {
    if (err) {
      callback (winston.makeError ('Elasticsearch createAlias error', {err : err}));
    } else {
      winston.doInfo ('successfully created alias for user', {userId : userId, index : esConnect.indexName});
      callback ();
    }
  });
}


exports.getIndexAliasForUser = function (userId) {
  return userId + '_' + esConnect.indexName;
}

exports.handleResponseData = function( responseData, metadata, callback ) {
  if ( ! responseData ) {
    winston.doError('no responseData returned from ES', {metadata : metadata});
    callback( {errorType: esUtils.ERROR_TYPE_NO_RESPONSE, message: ''} );

  } else {
      var parsed;

      try {
        parsed = JSON.parse( responseData );
      } catch (e) {
        callback (winston.makeError ('handleResponseData esUtils got a response invalid JSON', 
          {message : e.message, responseData : responseData, metadata : metadata}));

        if (responseData && typeof responseData === 'string' && responseData.substring ("504 Gateway")) {
          sesUtils.sendInternalNotificationEmail(JSON.stringify (metadata), 'ELASTIC SEARCH NGINX GATEWAY TIMEOUT: ' + os.hostname(), function (err) {});
        }

        return;
      }

      if ( ( ! parsed )
        || ( parsed.error )
        || ( parsed.status && ( parsed.status != 200 ) ) ) {

        var winstonWarnData = {
            responseData: responseData
          , esStatus: parsed.status
          , esError: parsed.error
        };
        //These are fairly common, and we'll expect the indexing code to know how to handle these
        // errors (either softFail or hardFail), so just do a warning.
        winston.doWarn('bad status in ES responseData', winstonWarnData);
        callback( {errorType: esUtils.ERROR_TYPE_BAD_RESPONSE, message: parsed.error} );

      } else {
        //all is well.
        //winston.doInfo('ES index valid response', {responseData: responseData});
        callback(null, parsed);
      }

    }
}

esUtils.isHardFail = function (esError) {
  if (!esError) {
    return false;
  }

  var hardFailMatch = constants.ES_HARD_FAILS;

  for (var i = 0; i < hardFailMatch.length; i ++) {
    if (esError.indexOf (hardFailMatch[i]) != -1) {
      return true;
    }
  }

  return false;
}

esUtils.handleError = function( esError, metadata, callback ) {
  winston.doError('error during indexing', {esError: esError, metadata: metadata});
  callback( { errorType: esUtils.ERROR_TYPE_ERROR, message: JSON.stringify(esError)} );
}
