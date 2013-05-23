var utils = require('../lib/utils'),
  winston = require('../lib/winstonWrapper').winston

var counter = 0;
var inputArg = 'hi';
var returnArg = 'bye';

var func = function( a, callback ) {
  counter++;
  if ( counter >= 3 ) {
    callback(null, a, returnArg);
  } else {
    callback( winston.makeError('fail') );
  }
};



utils.runWithRetries( func, 3, function(err, arg1, arg2) {
  if ( err ) {
    winston.handleError( err );

  } else {
    winston.doInfo('success!', {inputArg: arg1, outputArg: arg2});
  }
}, inputArg);