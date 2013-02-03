var winston = require ('./winstonWrapper').winston

var utils = this;

exports.checkParam = function( param, name, functionName, callback ) {
  if ( ! param ) {
    var message = functionName + ': ' + name + ' param missing';
    if ( callback ) {
      callback(message);
    }
    winston.error(message);
    return false;
  }
  return true;
}

exports.checkMongo = function(err, functionName, mongoCallName, callback ) {
  if ( err ) {
    var message = functionName + ': ' + mongoCallName + ': mongo error: ' + err;
    if ( callback ) {
      callback(message);
    }
    winston.error(message);
    return false;
  }
  return true;
}

if(!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g,'');
  };
}