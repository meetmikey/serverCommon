var sqsConnect = require('../lib/sqsConnect')
  , winston = require('../lib/winstonWrapper').winston

var maxWorkers = 1;
var workerTimeout = 2500;
var message = 'brand new';

sqsConnect.addMessageToMailReaderQueue( message, function(err) {
  winston.doInfo('done adding message');
});

var handleMessage = function( messageBody, callback ) {
  winston.doInfo('got message, never calling back');
}

sqsConnect.pollMailReaderQueue( handleMessage, maxWorkers, workerTimeout );