var crypto = require('crypto')
  , constants = require('../constants')
  
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

exports.safeStringify = function(value) {
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

if(!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g,'');
  };
}

exports.getRandomId = function( lengthInput ) {
  var rand = Math.random();
  var date = Date.now();
  var seedString = rand.toString() + date.toString();

  console.log(seedString);

  var md5Hash = crypto.createHash('md5');
  md5Hash.update( seedString );
  var hash = md5Hash.digest('hex');

  var length = constants.DEFAULT_QUICK_UNIQUE_ID_LENGTH;
  if ( lengthInput ) {
    length = lengthInput;
  }

  hash = hash.substring( 0, length );

  return hash;
}

exports.getUniqueId = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
  });  
}