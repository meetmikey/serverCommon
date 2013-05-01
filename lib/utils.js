var crypto = require('crypto')
  , constants = require('../constants')
  , winston = require('./winstonWrapper').winston

var utils = this;

exports.endsWith = function(str, suffix) {
  if (str && suffix) {
    var lastIndex = str.lastIndexOf(suffix);
    if ( lastIndex == ( str.length - suffix.length ) ) {
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