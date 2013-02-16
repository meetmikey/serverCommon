var serverCommon = process.env.SERVER_COMMON;

var winston = require ('winston')
  , constants = require(serverCommon + '/constants')

//default options... expand later
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console);

//doInfo, doWarn functions
//----------------------------------
winston.doInfo = function(log, extraInput) {
  var extra = winston.fixExtra( extraInput );
  winston.info( log, extra );
}

winston.doWarn = function(log, extraInput) {
  var extra = winston.fixExtra( extraInput );
  winston.warn( log, extra );
}

//do*Error functions
//----------------------------------

winston.doError = function(log, extraInput) {
  winston.handleError( winston.makeError(log, extraInput, 3) );
}

winston.doResponseError = function(res, log, responseCode, userMessage, extraInput) {
  winston.handleError( winston.makeResponseError(log, responseCode, userMessage, extraInput, 4), res );
}

winston.doMongoError = function(mongoErr, res) {
  winston.handleError( winston.makeMongoError(mongoErr, 5), res );
}

winston.doMissingParamError = function(paramName, res) {
  winston.handleError( winston.makeMissingParamError(paramName, 5), res );
}

winston.doS3Error = function(s3Err) {
  winston.handleError( winston.makeS3Error(s3Err, 5) );
}

winston.doElasticSearchError = function(esErr) {
  winston.handleError( winston.makeElasticSearchError(esErr, 5) );
}

//make*Error functions
//----------------------------------

winston.makeRequestError = function(requestError, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var error = winston.makeResponseError('request error', 500, 'internal error', {requestError: requestError}, skipStacktraceLines);
  return error;
}

winston.makeMongoError = function(mongoErr, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var error = winston.makeResponseError('mongo error', 500, 'internal error', {mongoErr: mongoErr}, skipStacktraceLines);
  return error;
}

winston.makeS3Error = function(s3Err, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var error = winston.makeResponseError('s3 error', 500, 'internal error', {s3Err: s3Err}, skipStacktraceLines);
  return error;
}

winston.makeElasticSearchError = function(esErr, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var error = winston.makeResponseError('elastic search error', 500, 'internal error', {esErr: esErr}, skipStacktraceLines);
  return error;
}

winston.makeMissingParamError = function(paramName, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var error = winston.makeResponseError('missing param: ' + paramName, 500, 'internal error', null, 4);
  return error;
}

//Winston kind of sucks at handling non-string metadata in our 'extra' params.
winston.fixExtra = function(extraInput) {
  var extra = {};
  if ( extraInput ) {
    for ( var key in extraInput ) {
      var value = extraInput[key];
      if ( ( ( typeof value ) != 'undefined' )
        && ( ( typeof value ) != 'string' ) ) {
        value = JSON.stringify( value );
      }
      extra[key] = value;
    }
  }
  return extra;
}

winston.makeError = function(log, extraInput, skipStacktraceLinesInput) {

  var error = null;
  if ( log ) {
    var skipStacktraceLines = 2;
    if ( skipStacktraceLinesInput ) {
      skipStacktraceLines = skipStacktraceLinesInput;
    }
    var extra = winston.fixExtra( extraInput );
    extra.stacktrace = winston.stacktrace(skipStacktraceLines);

    error = {
        log: log
      , extra: extra
    }
  }
  return error;
}

winston.makeResponseError = function(log, responseCode, userMessage, extra, skipStacktraceLinesInput) {
  var skipStacktraceLines = 3;
  if ( skipStacktraceLinesInput ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }

  var error = winston.makeError(log, extra, skipStacktraceLines);
  if ( error ) {
    
    error.message = constants.DEFAULT_RESPONSE_MESSAGE;
    error.code = constants.DEFAULT_RESPONSE_CODE;

    if ( userMessage ) {
      error.message = userMessage;
    }
    if ( responseCode ) {
      error.code = responseCode;
    }
  }
  return error;
}

//Note: Skips the first skipLinesInput of the stacktrace, defaults to 1 to skip itself
winston.stacktrace = function(skipLinesInput) {
  var skipLines = 1;
  if ( skipLinesInput ) {
    skipLines = skipLinesInput;
  }

  var fullStacktrace  = new Error().stack;

  var lineBreak = '\n';
  var split = fullStacktrace.split(lineBreak);
  stacktrace = fullStacktrace;
  if ( split && ( split.length > ( skipLines + 1 ) ) ) {
    var stacktrace = lineBreak;
    for ( var i=0; i<split.length; i++ ) {
      var stacktraceLine = split[i];
      if ( i > skipLines ) {
        stacktrace += stacktraceLine + lineBreak;
      }
    }
  }
  return stacktrace;
}

winston.handleError = function(err, res) {
  if ( err ) {
    var log = '';
    var extra = {};
    if ( err.log ) {
      log = err.log;
    }
    if ( err.extra ) {
      extra = err.extra;
    }
    winston.error(log, extra);
    if ( res ) {
      var message = constants.DEFAULT_RESPONSE_MESSAGE;
      if ( err.message ) {
        message = err.message;
      }
      var code = constants.DEFAULT_RESPONSE_CODE;
      if ( err.code ) {
        code = err.code
      }
      res.send(message, code);
    }
    return true;
  }
  return false;
}

exports.winston = winston