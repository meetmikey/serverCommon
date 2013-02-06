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

if(!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g,'');
  };
}