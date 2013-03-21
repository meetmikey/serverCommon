var conf = require ('../conf')
  , aws = require ('aws-lib')
  , winston = require ('./winstonWrapper').winston
  , constants = require ('../constants')

// See "http://docs.amazonwebservices.com/AWSSimpleQueueService/latest/APIReference/"
// General SQS actions do not require a "path" (CreateQueue, ListQueue, etc)

// Specific Queue options (CreateMessage, DeleteMessage, ReceiveMessage etc)
// need a specific path 
// http://sqs.us-east-1.amazonaws.com/123456789012/testQueue/
// /accountid/queue_name
var mailReaderOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailReadingQueue
}

var mailDownloadOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailDownloadQueue
}

var mailReaderQuickOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailReadingQuickQueue
}

var mailActiveConnectionOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailActiveConnectionQueue
}

var sqsConnect = this;

var mailReaderQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailReaderOptions);
var mailReaderQuickQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailReaderQuickOptions);
var mailDownloadQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailDownloadOptions);
var mailActiveConnectionQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailActiveConnectionOptions);

var currentNumObjects = {
  'mailReaderQueue' : 0,
  'mailReaderQuickQueue' : 0,
  'mailDownloadQueue' : 0,
  'mailActiveConnectionQueue' : 0
}

exports.addMessageToQueue = function( queue, message, callback ) {
  var messageBody = JSON.stringify( message );
  var sqsMessage = {
    MessageBody : messageBody  
  };
  queue.call( 'SendMessage', sqsMessage, function( err, result ) {
    winston.doInfo( 'Sent message to queue', {messageBody: messageBody} );
    if ( callback ) {
      callback( err, result );
    }
  });
}

exports.getMessageFromQueue = function( queue, callback ) {

  if ( ! queue ) { callback( winston.makeMissingParamError('queue') ); return; }

  queue.call( "ReceiveMessage", {MaxNumberOfMessages : 1}, function ( sqsError, sqsMessage ) {
    if ( sqsError ) {
      callback( winston.makeError( 'sqs error from ReceiveMessage', {sqsError: sqsError, queue: queue} ) );

    } else {
      var messageBody = sqsConnect.getSQSMessageAttribute( sqsMessage, 'Body' );
      callback( null, messageBody, function( err ) {
        if ( err ) {
          winston.handleError( err );

        } else {
          var receiptHandle = sqsConnect.getSQSMessageAttribute( sqsMessage, 'ReceiptHandle' );
          if ( receiptHandle ) {
            sqsConnect.deleteMessageFromQueue( queue, sqsMessage );
          }
        }
      });
    }
  });
}

exports.getSQSMessageAttribute = function(sqsMessage, attribute) {
  if ( sqsMessage
    && sqsMessage.ReceiveMessageResult 
    && sqsMessage.ReceiveMessageResult.Message
    && sqsMessage.ReceiveMessageResult.Message[attribute] ) {
    return sqsMessage.ReceiveMessageResult.Message[attribute];
  }
  return null;
}

//consecutiveMisses should include the current miss.
exports.getWorkQueueWaitTime = function( consecutiveMisses ) {
  var baseWait = constants.QUEUE_WAIT_TIME_BASE;
  var wait = baseWait;
  if ( consecutiveMisses ) {
    wait = baseWait * Math.pow(2, ( consecutiveMisses - 1 ) );
  }
  if ( wait > constants.QUEUE_MAX_WAIT_TIME ) {
    wait = constants.QUEUE_MAX_WAIT_TIME;
  }
  return wait;
}

//A 'miss' is either an sqs error or 'no message'.
exports.reworkQueue = function( queue, handleMessageFunction, isMiss, previousConsecutiveMisses ) {

  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! handleMessageFunction ) { winston.doMissingParamError('handleMessageFunction'); return; }

  var waitTime = 0;
  var newConsecutiveMisses = 0;

  if ( isMiss ) {
    //SQS sueues should be configured to long-poll, so requests/second should be minimal when there are no messages.
    //But just in case, let's back off if we're never getting any (with a limit).
    newConsecutiveMisses = 1;
    if ( previousConsecutiveMisses ) {
      newConsecutiveMisses = previousConsecutiveMisses + 1;
    }
    waitTime = sqsConnect.getWorkQueueWaitTime( newConsecutiveMisses );
  }

  setTimeout( function() {
    sqsConnect.workQueue( queue, handleMessageFunction, newConsecutiveMisses );
  }, waitTime );
}

//A 'miss' is either an sqs error or 'no message'.
exports.workQueue = function( queue, handleMessageFunction, previousConsecutiveMisses ) {

  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! handleMessageFunction ) { winston.doMissingParamError('handleMessageFunction'); return; }

  winston.doInfo('working queue...');

  sqsConnect.getMessageFromQueue( queue, function( err, messageBody, messageCallback ) {
    if ( err ) {
      winston.handleError( err );
      sqsConnect.reworkQueue( queue, handleMessageFunction, true, previousConsecutiveMisses );

    } else if ( ! messageBody ) {
      sqsConnect.reworkQueue( queue, handleMessageFunction, true, previousConsecutiveMisses );

    } else {
      handleMessageFunction( messageBody, function(err) {
        messageCallback( err );
        sqsConnect.reworkQueue( queue, handleMessageFunction );
      });
    }
  });
}

exports.pollQueue = function( queue, handleMessageFunction, maxObjectsInput ) {

  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! handleMessageFunction ) { winston.doMissingParamError('handleMessageFunction'); return; }

  var maxObjects = 1;
  if ( ! maxObjectsInput ) {
    winston.doWarn('no maxObjects specified, assuming 1!');
  } else {
    maxObjects = maxObjectsInput;
  }

  for ( var i=0; i<maxObjects; i++ ) {
    setTimeout( function() {
      winston.doInfo('Starting queue worker...');
      sqsConnect.workQueue( queue, handleMessageFunction );
    }, 0 );
  }
}


exports.deleteMessageFromQueue = function( queue, sqsMessage ) {
  
  var receiptHandle = sqsConnect.getSQSMessageAttribute(sqsMessage, 'ReceiptHandle');

  if ( ! receiptHandle ) {
    winston.doError('missing receipt handle', {sqsMessage: sqsMessage} );
    return;
  }

  var outbound = {
    ReceiptHandle: receiptHandle
  };
  //winston.info('deleting message from queue...', receiptHandle);
  queue.call( "DeleteMessage", outbound, function (err) {
    if ( err ) {
      winston.doError('got error from DeleteMessage', {err: err});
    } else {
      var message = sqsConnect.getSQSMessageAttribute(sqsMessage, 'Body');
      winston.info('deleted message from queue', {message: message});
    }
  });
}

exports.addMessageToMailReaderQueue = function (message) {
  this.addMessageToQueue(mailReaderQueue, message);
}

exports.addMessageToMailReaderQuickQueue = function (message) {
  this.addMessageToQueue(mailReaderQuickQueue, message);
}

exports.addMessageToMailDownloadQueue = function (message, callback) {
  this.addMessageToQueue(mailDownloadQueue, message, callback);
}

exports.addMessageToMailActiveConnectionQueue = function (message, callback) {
  this.addMessageToQueue(mailActiveConnectionQueue, message, callback);
}

exports.pollMailReaderQueue = function( handleMessage, maxObjects ) {
  this.pollQueue( mailReaderQueue, handleMessage, maxObjects );
}

exports.pollMailReaderQuickQueue = function( handleMessage, maxObjects ) {
  this.pollQueue( mailReaderQuickQueue, handleMessage, maxObjects );
}

exports.pollMailDownloadQueue = function( handleMessage, maxObjects ) {
  this.pollQueue( mailDownloadQueue, handleMessage, maxObjects );
}

exports.pollMailActiveConnectionQueue = function ( handleMessage, maxObjects ) {
  this.pollQueue( mailActiveConnectionQueue, handleMessage, maxObjects );
}