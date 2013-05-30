var winston = require('winston')
  , constants = require('../constants')
  , fs = require('fs')
  , conf = require('../conf')
  , rollbar = require('./rollbarWrapper').rollbar

var environment = process.env.NODE_ENV;

//default options... expand later
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {timestamp: true});


// read into winstonError obj and get the type
winston.getErrorType = function (winstonError) {
  if (!winstonError || !winstonError.extra) {
    return "";
  }
  else {
    return winstonError.extra.type;
  }
}

// read into winstonError obj and get whether to delete the msg from queue
winston.getDeleteFromQueueFlag = function (winstonError) {
  if (!winstonError || !winstonError.extra) {
    return null;
  }
  else {
    return winstonError.extra.deleteFromQueue;
  }
}

winston.getSuppressQueueErrorFlag = function (winstonError) {
  if (!winstonError || !winstonError.extra) {
    return null;
  } else {
    return winstonError.extra.suppressError;
  }

}

//doInfo, doWarn functions
//----------------------------------
winston.doInfo = function(log, extraInput, forceDisplay) {
  var extra = winston.fixExtra( extraInput );
  if ( conf.debugMode || forceDisplay ) {
    winston.info( log, extra );
  }
  rollbar.trackMessage(log, 'info');
}

winston.doWarn = function(log, extraInput) {
  var extra = winston.fixExtra( extraInput );
  winston.warn( log, extra );
  rollbar.trackMessage(log, 'warning');
}

//do*Error functions
//----------------------------------

winston.doError = function(log, extraInput) {
  winston.handleError( winston.makeError(log, extraInput, 3) );
}

winston.doResponseError = function(res, log, responseCode, userMessage, extraInput) {
  winston.handleError( winston.makeResponseError(log, responseCode, userMessage, extraInput, 4), res );
}

winston.doMongoError = function(mongoErr, extraInput, res) {
  winston.handleError( winston.makeMongoError(mongoErr, extraInput, 5), res );
}

winston.doMissingParamError = function(paramName, extraInput, res) {
  winston.handleError( winston.makeMissingParamError(paramName, extraInput, 5), res );
}

winston.doS3Error = function(s3Err, extraInput, res) {
  winston.handleError( winston.makeS3Error(s3Err, extraInput, 5), res );
}

winston.doAzureError = function(azureErr, extraInput, res) {
  winston.handleError( winston.makeAzureError(azureErr, extraInput, 5), res );
}

winston.doElasticSearchError = function(esErr, extraInput, res) {
  winston.handleError( winston.makeElasticSearchError(esErr, extraInput, 5), res );
}

//make*Error functions
//----------------------------------

winston.makeRequestError = function(requestError, extraInput, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput !== undefined ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var extra = winston.mergeExtra( extraInput, {requestError: requestError.message});
  var error = winston.makeResponseError('request error', 500, 'internal error', extra, skipStacktraceLines);
  return error;
}

winston.makeMongoError = function(mongoErrInput, extraInput, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput !== undefined ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var mongoErr = mongoErrInput;
  if ( mongoErrInput && ( typeof mongoErrInput == 'object' ) ) {
    mongoErr = mongoErrInput.toString();
  }
  var extra = winston.mergeExtra( extraInput, {mongoErr: mongoErr});
  var error = winston.makeResponseError('mongo error', 500, 'internal error', extra, skipStacktraceLines);
  return error;
}

winston.makeS3Error = function(s3Err, extraInput, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput !== undefined ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var newExtra = {};
  if ( s3Err ) {
    newExtra['s3Err'] = s3Err.message;
  }
  var extra = winston.mergeExtra( extraInput, newExtra );
  var error = winston.makeResponseError('s3 error', 500, 'internal error', extra, skipStacktraceLines);
  return error;
}

winston.makeAzureError = function(azureErr, extraInput, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput !== undefined ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var extra = winston.mergeExtra( extraInput, {azureErr: azureErr});
  var error = winston.makeResponseError('azure error', 500, 'internal error', extra, skipStacktraceLines);
  return error;
}

winston.makeElasticSearchError = function(esErr, extraInput, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput !== undefined ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var esErrorString = '';
  if ( esErr ) {
    esErrorString = esErr.toString();
  }
  var extra = winston.mergeExtra( extraInput, {esErr: esErrorString});
  var error = winston.makeResponseError('elastic search error', 500, 'internal error', extra, skipStacktraceLines);
  return error;
}

winston.makeMissingParamError = function(paramName, extraInput, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput !== undefined ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var extra = winston.mergeExtra( extraInput, {});
  var error = winston.makeResponseError('missing param: ' + paramName, 500, 'internal error', extra, skipStacktraceLines);
  return error;
}

//Winston kind of sucks at handling non-string metadata in our 'extra' params.
winston.fixExtra = function(extraInput) {
  var extra = {};
  for ( var key in extraInput ) {
    var value = extraInput[key];
    value = winston.safeStringify( value );
    extra[key] = value;
  }
  return extra;
}

winston.safeStringify = function(value) {
  if ( value === null ) {
    return '(null)';
  }
  if ( ( typeof value ) == 'undefined' ) {
    return '(undefined)';
  }
  if ( ( typeof value ) == 'string' ) {
    return value;
  }
  if ( ( typeof value ) === 'object' ) {
    var cache = [];
    value = JSON.stringify(value, function(key, value) {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return '(circular)';
        }
        cache.push(value);
      }
      return value;
    }, "\t");
    cache = null;
    return value;
  }
  if ( Array.isArray(value) ) {
    value = value.toString();
    return value;
  }
  value = value.toString();
  return value;
}

winston.mergeExtra = function(extraInput1, extraInput2) {
  var extra1 = extraInput1;
  if ( ( extra1 === null ) || ( extra1 === undefined ) ) {
    extra1 = {};
  }

  var extra2 = extraInput2;
  if ( ( extra2 === null ) || ( extra2 === undefined ) ) {
    extra2 = {};
  }

  var extra = {};
  for ( var key in extra1 ) {
    extra[key] = extra1[key];
  }

  for ( var key in extra2 ) {
    extra[key] = extra2[key];
  }

  return extra;
}

winston.makeError = function(log, extraInput, skipStacktraceLinesInput) {

  var error = null;
  if ( log ) {
    var skipStacktraceLines = 2;
    if ( skipStacktraceLinesInput !== undefined ) {
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
  if ( skipStacktraceLinesInput !== undefined ) {
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
  if ( skipLinesInput !== undefined ) {
    skipLines = skipLinesInput;
  }
  
  try {
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
  } catch ( exception ) {
    var message = '(stacktrace exception!)';
    if ( exception ) {
      message += ' ' + exception.toString();
    }
    return message;
  }
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
    rollbar.trackMessage(log);
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


// clear visual indication of break in logs (used during restart)
winston.logBreak = function() {
  winston.consoleLog( constants.LOG_BREAK );
  winston.consoleError( constants.LOG_BREAK );
}

winston.consoleLog = console.log;
winston.consoleError = console.error;

exports.winston = winston
