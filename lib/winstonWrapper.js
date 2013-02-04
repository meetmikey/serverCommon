var serverCommon = process.env.SERVER_COMMON;

var winston = require ('winston')
  , constants = require(serverCommon + '/constants')

//default options... expand later
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {timestamp: true});

winston.doError = function(log, extraInput) {
  winston.handleError( winston.makeError(log, extraInput, 3) );
}

winston.doResponseError = function(res, log, responseCode, userMessage, extraInput) {
  winston.handleError( winston.makeResponseError(log, responseCode, userMessage, extraInput, 4), res );
}

winston.doMongoError = function(mongoErr, res) {
  winston.handleError( winston.makeMongoError(mongoErr, 5), res );
}

winston.makeMongoError = function(mongoErr, skipStacktraceLinesInput) {
  var skipStacktraceLines = 4;
  if ( skipStacktraceLinesInput ) {
    skipStacktraceLines = skipStacktraceLinesInput;
  }
  var error = winston.makeResponseError('mongo error', 500, 'internal error', {mongoErr: mongoErr}, skipStacktraceLines);
  return error;
}

winston.makeS3Error = function(s3Err) {
  var error = winston.makeResponseError('s3 error', 500, 'internal error', {s3Err: err}, 4);
  return error;
}

winston.makeMissingParamError = function(paramName) {
  var error = winston.makeResponseError('missing param: ' + paramName, 500, 'internal error', null, 4);
  return error;
}

winston.makeError = function(log, extraInput, skipStacktraceLinesInput) {

  var error = null;
  if ( log ) {
    var extra = {};
    for (var key in extraInput) {
      extra[key] = extraInput[key];
    }
    var skipStacktraceLines = 2;
    if ( skipStacktraceLinesInput ) {
      skipStacktraceLines = skipStacktraceLinesInput;
    }
    extra.stacktrace = utils.stacktrace(skipStacktraceLines);

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

  var error = utils.makeError(log, extra, skipStacktraceLines);
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