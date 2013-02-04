var winston = require ('winston')

//default options... expand later
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {timestamp: true});

winston.doError = function(log, extraInput) {
  var error = winston.makeError(log, extraInput, 3);
  winston.handleError(error);
}

winston.doResponseError = function(log, responseCode, userMessage, extraInput) {
  var error = winston.makeResponseError(log, responseCode, userMessage, extraInput, 4);
  winston.handleError(error);
}

winston.makeMongoError = function(mongoErr) {
  var error = winston.makeError('mongo error', {mongoErr: mongoErr}, 3);
  return error;
}

winston.makeS3Error = function(s3Err) {
  var error = winston.makeError('s3 error', {s3Err: err}, 3);
  return error;
}

winston.makeMissingParamError = function(paramName) {
  var error = winston.makeError('missing param: ' + paramName, null, 3);
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
      res.send(err.message, err.code);
    }
    return true;
  }
  return false;
}

exports.winston = winston