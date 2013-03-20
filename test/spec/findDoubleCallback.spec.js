var serverCommon = process.env.SERVER_COMMON;

var async = require('async')
  , winston = require(serverCommon + '/lib/winstonWrapper').winston

var MAX_RETRIES = 3;

describe('findDoubleCallback', function() {

  var dummy = function(callback) {
    //callback();
    callback( winston.makeError('DUMMY ERROR') );
  }

  var putBuffer = function(attempts, callback) {
    dummy( function(err, res) {
      if ( err ) {
        winston.doWarn('warn 1');
        retry(err);

      } else {
        winston.doInfo('ok 1');
        callback();
      }
    });

    var retry = function (err) {
      if ( attempts < MAX_RETRIES ) {
        winston.doInfo('retrying...', {attempts: attempts});
        putBuffer( attempts + 1, callback );

      } else {
        callback( winston.makeError('hit max') );
      }
    }
  }

  it( 'try it', function() {

    var a = [0,1,2,3,4,5];
    async.forEach( a, function(thisA, forEachCallback) {

      putBuffer(0, function(err) {
        if ( err ) {

        } else {
          winston.doInfo('finished, no prob');
        }
        forEachCallback(err);
      });
    }, function(err) {
      winston.handleError(err);
    });
  })
});