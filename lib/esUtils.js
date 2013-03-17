var elasticSearchClient = require('./esConnect').getClient()
  , winston= require('./winstonWrapper').winston

var esUtils = this;

exports.ERROR_TYPE_NO_RESPONSE = 'no response';
exports.ERROR_TYPE_BAD_RESPONSE = 'bad response';
exports.ERROR_TYPE_EXCEPTION = 'exception';
exports.ERROR_TYPE_ERROR = 'error';

exports.index = function( index, type, id, data, parent, callback ) {

  if ( ! index ) { callback( winston.makeMissingParamError('index') ); return; }
  if ( ! type ) { callback( winston.makeMissingParamError('type') ); return; }
  if ( ! id ) { callback( winston.makeMissingParamError('id') ); return; }
  if ( ! data ) { callback( winston.makeMissingParamError('data') ); return; }

  var options = {'id': id};
  if ( parent ) {
    options['parent'] = parent;
  }

  elasticSearchClient.index( index, type, data, options)
    .on('data', function( responseData ) {
      esUtils.handleResponseData( responseData, index, type, id, callback );
    })
    .on('error', function( esError ) {
      esUtils.handleError( esError, index, type, id, callback );
    })
    .exec();
}

exports.get = function( index, type, id, data, callback ) {
  
}

exports.delete = function( index, type, id, callback ) {

  if ( ! index ) { callback( winston.makeMissingParamError('index') ); return; }
  if ( ! type ) { callback( winston.makeMissingParamError('type') ); return; }
  if ( ! id ) { callback( winston.makeMissingParamError('id') ); return; }

  elasticSearchClient.deleteDocument( 'mail', 'resource', id )
    .on( 'data', function( responseData ) {
      esUtils.handleResponseData( responseData, index, type, id, callback );
    })
    .on( 'error', function( esError ) {
      esUtils.handleError( esError, index, type, id, callback );
    })
    .exec();
}

exports.handleResponseData = function( responseData, index, type, id, callback ) {
  if ( ! responseData ) {
    winston.handleError( winston.makeError('no responseData returned from ES', {index: index, type: type, id: id}) );
    callback( {errorType: esUtils.ERROR_TYPE_NO_RESPONSE, message: ''} );

  } else {
    try {
      var parsed = JSON.parse( responseData );
      if ( ( ! parsed ) || ( parsed.error ) || ( ! parsed['ok'] ) || ( parsed['ok'] !== true ) ) {
        winston.handleError( winston.makeError('bad status in ES responseData', {responseData: responseData, esError: parsed.error}) );
        callback( {errorType: esUtils.ERROR_TYPE_BAD_RESPONSE, message: parsed.error} );

      } else {
        //all is well.
        winston.doInfo('ES index valid response', {responseData: responseData});
        callback();
      }

    } catch ( exception ) {
      winston.handleError( winston.makeError('exception parsing ES responseData', {responseData: responseData}) );
      callback( {errorType: esUtils.ERROR_TYPE_EXCEPTION, message: exception.message} );
    }
  }
}

esUtils.handleError = function( esError, index, type, id, callback ) {
  winston.handleError( winston.makeError('error during indexing', {esError: esError, index: index, type: type, id: id}) );
  callback( { errorType: ERROR_TYPE_ERROR, message: JSON.stringify(error)} );
}