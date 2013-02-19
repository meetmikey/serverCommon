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