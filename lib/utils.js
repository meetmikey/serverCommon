var crypto = require('crypto')
  , constants = require('../constants')
  , winston = require('./winstonWrapper').winston

var utils = this;

exports.isArray = function( thing ) {
  if ( thing === null || thing === undefined ) {
    return false;
  }
  if( Object.prototype.toString.call( thing ) === '[object Array]' ) {
    return true;
  }
  return false;
}

exports.isObject = function( thing ) {
  if ( thing === null || thing === undefined ) {
    return false;
  }
  if( Object.prototype.toString.call( thing ) === '[object Object]' ) {
    return true;
  }
  return false;
}

exports.endsWith = function(str, suffix) {
  if (str && suffix) {
    var lastIndex = str.lastIndexOf(suffix);
    if ( lastIndex > -1 && lastIndex == ( str.length - suffix.length ) ) {
      return true;
    }
  }
  return false;
}

exports.containsSubstringFromArray = function( haystack, needles ) {
  if ( ! haystack ) {
    return false;
  }
  if ( ! needles || ( ! ( needles.length > 0 ) ) ) {
    return false;
  }
  for ( var i=0; i<needles.length; i++ ) {
    var needle = needles[i];
    if ( needle && ( haystack.indexOf( needle ) !== -1 ) ) {
      return true;
    }
  }
  return false;
}

if(!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g,'');
  };
}

exports.getRandomId = function( lengthInput ) {
  var rand = Math.random();
  var date = Date.now();
  var seedString = rand.toString() + date.toString();

  var hash = utils.getHash( seedString, 'md5' );

  var length = constants.DEFAULT_QUICK_UNIQUE_ID_LENGTH;
  if ( lengthInput ) {
    length = lengthInput;
  }

  hash = hash.substring( 0, length );

  return hash;
}

exports.getHash = function( input, typeInput ) {

  if ( ! input ) {
    winston.doWarn('utils: getHash: no input!');
    return '';
  }

  var type = 'md5';
  if ( typeInput ) {
    type = typeInput;
  }

  var validTypes = ['sha1', 'md5', 'sha256', 'sha512'];
  if ( validTypes.indexOf( type ) === -1 ) {
    winston.doError('utils: getHash: invalid hash type', {type: type});
    return '';
  }

  var md5Hash = crypto.createHash( type );
  md5Hash.update( input );
  var hash = md5Hash.digest('hex');

  return hash;
}

exports.getUniqueId = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
  });  
}

exports.streamToBuffer = function( stream, callback ) {

  if ( ! stream ) { callback( winston.makeMissingParamError('stream') ); return; }

  var buffers = [];

  stream.on('data', function( chunk ) {
    buffers.push( new Buffer( chunk, 'binary' ) );
  });

  stream.on('end', function () {
    var buffer = null;


    try {
      buffer = Buffer.concat( buffers );
      callback (null, buffer);
    } catch (e) {
      callback( winston.makeError ('caught error concatenating buffer', {message : e.message, stack : e.stack}) );
    }

  });
}

exports.runWithRetries = function( func, numAttempts, callback, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8 ) {
  var randomId = utils.getRandomId(4);
  utils.runWithRetriesCountingFails( func, numAttempts, callback, 0, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8 );
}

exports.runWithRetriesCountingFails = function( func, numRemainingAttempts, callback, numPreviousFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8 ) {
  if ( ! func ) { callback( winston.makeMissingParamError('func') ); return; }
  if ( ! numRemainingAttempts ) { callback( winston.makeMissingParamError('numRemainingAttempts') ); return; }

  numRemainingAttempts -= 1;

  if ( typeof arg8 !== 'undefined' ) {
    func( arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, function( err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 ) {
      utils.runWithRetriesCallback( func, numRemainingAttempts, callback, numPreviousFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 );
    });
  } else if ( typeof arg7 !== 'undefined' ) {
    func( arg1, arg2, arg3, arg4, arg5, arg6, arg7, function( err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 ) {
      utils.runWithRetriesCallback( func, numRemainingAttempts, callback, numPreviousFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 );
    });
  } else if ( typeof arg6 !== 'undefined' ) {
    func( arg1, arg2, arg3, arg4, arg5, arg6, function( err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 ) {
      utils.runWithRetriesCallback( func, numRemainingAttempts, callback, numPreviousFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 );
    });
  } else if ( typeof arg5 !== 'undefined' ) {
    func( arg1, arg2, arg3, arg4, arg5, function( err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 ) {
      utils.runWithRetriesCallback( func, numRemainingAttempts, callback, numPreviousFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 );
    });
  } else if ( typeof arg4 !== 'undefined' ) {
    func( arg1, arg2, arg3, arg4, function( err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 ) {
      utils.runWithRetriesCallback( func, numRemainingAttempts, callback, numPreviousFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 );
    });
  } else if ( typeof arg3 !== 'undefined' ) {
    func( arg1, arg2, arg3, function( err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 ) {
      utils.runWithRetriesCallback( func, numRemainingAttempts, callback, numPreviousFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 );
    });
  } else if ( typeof arg2 !== 'undefined' ) {
    func( arg1, arg2, function( err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 ) {
      utils.runWithRetriesCallback( func, numRemainingAttempts, callback, numPreviousFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 );
    });
  } else if ( typeof arg1 !== 'undefined' ) {
    func( arg1, function( err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 ) {
      utils.runWithRetriesCallback( func, numRemainingAttempts, callback, numPreviousFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 );
    });
  } else {
    func( function( err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 ) {
      utils.runWithRetriesCallback( func, numRemainingAttempts, callback, numPreviousFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 );
    });
  }
}

utils.runWithRetriesCallback = function( func, numRemainingAttempts, callback, numPreviousFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6, cbArg7, cbArg8 ) {
  if ( err && ( numRemainingAttempts >= 1 ) ) {
    
    numFails = numPreviousFails + 1;
    //winston.doWarn('runWithRetries fail', {randomId: randomId, numRemainingAttempts: numRemainingAttempts, numFails: numFails, arg1: arg1, arg2: arg2, arg3: arg3});
    winston.doWarn('runWithRetries fail', {randomId: randomId, numRemainingAttempts: numRemainingAttempts, numFails: numFails, arg2: arg2, arg3: arg3});
    
    var waitTime = utils.getRetryWaitTime( numFails );
    setTimeout( function() {
      utils.runWithRetriesCountingFails( func, numRemainingAttempts, callback, numFails, randomId, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8 );
    }, waitTime );

  } else {
    if ( callback ) {
      callback( err, cbArg1, cbArg2, cbArg3, cbArg4, cbArg5, cbArg6 );
    }
  }
}

//returns the wait time in milliseconds, using exponential backoff with a max.
exports.getRetryWaitTime = function( numFails ) {
  var baseWait = constants.MIN_RETRY_WAIT_TIME_MS;
  var waitTime = baseWait;

  if ( numFails ) {
    wait = baseWait * Math.pow(2, ( numFails - 1 ) );
  }

  if ( waitTime > constants.MAX_RETRY_WAIT_TIME_MS ) {
    waitTime = constants.MAX_RETRY_WAIT_TIME_MS;
  }
  return waitTime;
}