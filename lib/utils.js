var crypto = require('crypto')
  , constants = require('../constants')
  , winston = require('./winstonWrapper').winston
  , bigdecimal = require ('bigdecimal')

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

exports.convertToISOString = function (unixTS, adjust) {
  return new Date(unixTS + adjust).toISOString();
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

exports.regexMatch = function(str, regexArray) {
  if (! str ) {
    return false;
  }
  var matchExists = false;
  regexArray.forEach (function (regexStr) {
    var regex = new RegExp(regexStr, 'g');
    if (str.match (regex)) {
      matchExists = true;
    }
  });

  return matchExists;
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
  var hasCalledBack = false;

  stream.on('data', function( chunk ) {
    buffers.push( new Buffer( chunk, 'binary' ) );
  });

  stream.on('end', function () {

    if ( hasCalledBack ) {
      winston.doWarn('streamToBuffer end, but has already called back');

    } else {
      try {
        var buffer = null;
        buffer = Buffer.concat( buffers );
        buffers = null;
        delete buffers;
        hasCalledBack = true;
        callback (null, buffer);
      } catch (e) {
        if (e.message == 'spawn ENOMEM') {
          // TODO: this is catching the wrong thing, just exit for now
          process.exit (1);
        }

        if ( hasCalledBack ) {
          winston.doWarn('streamToBuffer exception, but has already called back');

        } else {
          buffers = null;
          delete buffers;
          hasCalledBack = true;
          callback( winston.makeError ('caught error concatenating buffer', {message : e.message, stack : e.stack}) );
        }
      }
    }
  });

  stream.on('error', function (err) {

    if ( hasCalledBack ) {
      winston.doWarn('streamToBuffer error, but has already called back', {err: err});

    } else {
      buffers = null;
      delete buffers;

      hasCalledBack = true;
      callback( winston.makeError('streamToBuffer error', {err: err}) );
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

exports.getFullName = function( firstName, lastName ) {
  if ( firstName && lastName ) {
    return firstName + ' ' + lastName;
  }
  if ( lastName ) {
    return lastName;
  }
  if ( firstName ) {
    return firstName;
  }
  return '';
}


exports.hexToDecimal = function( hex ) {

  if ( ! hex ) {
    return 0;
  }

  function hexToDecimalAdd(x, y) {
    var c = 0, r = [];
    var x = x.split('').map(Number);
    var y = y.split('').map(Number);
    while(x.length || y.length) {
      var s = (x.pop() || 0) + (y.pop() || 0) + c;
      r.unshift(s < 10 ? s : s - 10); 
      c = s < 10 ? 0 : 1;
    }
    if(c) r.unshift(c);
    return r.join('');
  }

  var dec = '0';
  hex.split('').forEach(function(chr) {
    var n = parseInt(chr, 16);
    for(var t = 8; t; t >>= 1) {
      dec = hexToDecimalAdd(dec, dec);
      if(n & t) dec = hexToDecimalAdd(dec, '1');
    }
  });
  return dec;
}

exports.decimalToHex = function( decimal ) {
  return decimal ? new bigdecimal.BigInteger(decimal).toString(16) : '';
}