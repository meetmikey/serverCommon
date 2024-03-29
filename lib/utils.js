var crypto = require('crypto')
  , constants = require('../constants')
  , winston = require('./winstonWrapper').winston
  , ObjectId = require('mongoose').Types.ObjectId

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

exports.objectIdWithTimestamp = function (timestamp) {
  // Convert string date to Date object (otherwise assume timestamp is a date)
  if (typeof(timestamp) == 'string') {
      timestamp = new Date(timestamp);
  }

  // Convert date object to hex seconds since Unix epoch
  var hexSeconds = Math.floor(timestamp/1000).toString(16);

  // Create an ObjectId with that hex timestamp
  var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");

  return constructedObjectId;
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

exports.isString = function( input ) {
  return Object.prototype.toString.call( input ) == '[object String]';
}

//Checks if input is a number.
//NOTE!.. also returns true if it's a string containing a numeric value.
exports.isNumber = function( input ) {
  return !isNaN(parseFloat(input)) && isFinite(input);
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

// callback (err, buffer, isAborted)
exports.streamToBuffer = function( stream, capBuffer, callback ) {
  if ( ! stream ) { callback( winston.makeMissingParamError('stream') ); return; }

  var buffers = [];
  var hasCalledBack = false;
  var totalSize = 0;

  stream.on('data', function( chunk ) {
    if (buffers) {
      buffers.push( new Buffer( chunk, 'binary' ) );

      // cap the size of the response to avoid memory problems with large files...
      if (capBuffer) {
        totalSize+=chunk.length;
        if (totalSize > constants.MAX_STREAM_TO_BUFFER) {
          winston.doWarn('streamToBuffer: MAX_STREAM_TO_BUFFER exceeded', {size : totalSize});
          var buffer = Buffer.concat (buffers);
          buffers = null;
          delete buffers;

          // last argument indicates that the buffer is truncated
          callback(null, buffer, true);
          hasCalledBack = true;
        }
      }
    } else {
      if (!hasCalledBack) {
        callback( winston.makeError('streamToBuffer error, buffer is null') );
        hasCalledBack = true;
      }
    }
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
          winston.doWarn('streamToBuffer exception, but has already called back', {message : e.message, stack : e.stack});

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
    waitTime = baseWait * Math.pow(2, ( numFails - 1 ) );
  }

  if ( waitTime > constants.MAX_RETRY_WAIT_TIME_MS ) {
    waitTime = constants.MAX_RETRY_WAIT_TIME_MS;
  }
  return waitTime;
}

exports.getFullNameFromUser = function( user ) {
  if ( ! user ) {
    return '';
  }
  return utils.getFullName( user.firstName, user.lastName );
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

exports.convertToInt = function (strNumber) {
  if (typeof strNumber === 'string') {
    return Number(strNumber);
  } else if (typeof strNumber === 'number') {
    return strNumber;
  } else {
    return null;
  }
}

exports.isWebResponseTooBig = function (response) {
  if (response.headers && response.headers['content-length']) {
    var length = utils.convertToInt (response.headers['content-length']);
    return (length && length > constants.MAX_STREAM_TO_BUFFER);
  } else {
    return false;
  }
}

exports.getMixpanelPixelURL = function( eventType, eventDataInput ) {

  var eventData = {};
  if ( eventDataInput ) {
    eventData = eventDataInput;
  }
  eventData['token'] = constants.MIXPANEL_TOKEN;

  var url = 'http://api.mixpanel.com/track/?data=';
  var eventData = {
      'event': eventType
    , 'properties': eventData
  }
  var encodedData = utils.encodeB64( eventData );
  url += encodedData;
  url = url + '&ip=1&img=1';
  return url;
}

exports.encodeB64 = function( obj ) {
  var encoded = '';
  try {
    var objString = '';
    if ( utils.isObject( obj ) || utils.isArray( obj ) ) {
      objString = JSON.stringify( obj );
    } else {
      objString = obj.toString();
    }
    var buffer = new Buffer( objString, 'binary' );
    encoded = buffer.toString('base64');
  } catch ( exception ) {}
  return encoded;
}

exports.mergeObjects = function( objInput1, objInput2 ) {
  mergedObj = winston.mergeExtra( objInput1, objInput2 );
  return mergedObj;
}

exports.divideByUnit = function( input, unit, precision ) {
  var output = (input / unit).toFixed( precision );
  return output;
}

exports.formatFileSize = function( bytes, precisionInput ) {

  if ( ( ! bytes ) || ( bytes <= 0 ) ) {
    return '0 B';
  }

  var precision = 1;
  if ( precisionInput ) {
    precision = precisionInput;
  }

  if ( bytes < constants.KILOBYTE ) {
    return utils.divideByUnit( bytes, 1, precision ) + ' B';

  } else if ( bytes < constants.MEGABYTE ) {
    return utils.divideByUnit( bytes, constants.KILOBYTE, precision ) + ' KB';

  } else if ( bytes < constants.GIGABYTE ) {
    return utils.divideByUnit( bytes, constants.MEGABYTE, precision ) + ' MB';

  } else if ( bytes < constants.TERABYTE ) {
    return utils.divideByUnit( bytes, constants.GIGABYTE, precision ) + ' GB';

  } else if ( constants.TERABYTE <= bytes ) {
    return utils.divideByUnit( bytes, constants.TERABYTE, precision ) + ' TB';

  } else {
    return bytes + ' B';
  }
}