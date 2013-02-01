exports.checkParam = function( param, name, functionName, callback ) {
  if ( ! param ) {
    var message = 'Error: ' + functionName + ': ' + name + ' param missing';
    if ( callback ) {
      callback(message);
    }
    console.error(message);
    return false;
  }
  return true;
}

exports.checkMongo = function(err, functionName, mongoCallName, callback ) {
  if ( err ) {
    var message = 'Error: ' + functionName + ': ' + mongoCallName + ': mongo error: ' + err;
    if ( callback ) {
      callback(message);
    }
    console.error(message);
    return false;
  }
  return true;
}

if(!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g,'');
  };
}