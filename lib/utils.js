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

  if ( ( ( typeof value ) == 'undefined' )
    || ( ( typeof value ) == 'string' ) ) {
    return value;
  }

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

if(!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g,'');
  };
}