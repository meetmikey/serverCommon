var conf = require ('../conf')
  , aws = require ('aws-lib')
  , winston = require ('./winstonWrapper').winston
  , constants = require ('../constants')
  , utils = require('./utils')
  , async = require('async')

var sqsConnect = this;

// See "http://docs.amazonwebservices.com/AWSSimpleQueueService/latest/APIReference/"
// General SQS actions do not require a "path" (CreateQueue, ListQueue, etc)

// Specific Queue options (CreateMessage, DeleteMessage, ReceiveMessage etc)
// need a specific path 
// http://sqs.us-east-1.amazonaws.com/123456789012/testQueue/
// /accountid/queue_name


var workers = {};


/*
  MailReader Queue
  --------------------------------------
*/
var QUEUE_NAME_MAIL_READER = 'mailReader';
var mailReaderOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailReadingQueue
}
var mailReaderQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailReaderOptions);
exports.addMessageToMailReaderQueue = function( message, callback ) {
  this.addMessageToQueue( mailReaderQueue, QUEUE_NAME_MAIL_READER, message, callback );
}
exports.pollMailReaderQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  this.pollQueue( mailReaderQueue, QUEUE_NAME_MAIL_READER, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_MAIL_READER] = {};


/*
  MailReaderQuick Queue
  --------------------------------------
*/
var QUEUE_NAME_MAIL_READER_QUICK = 'mailReaderQuick';
var mailReaderQuickOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailReadingQuickQueue
}
var mailReaderQuickQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailReaderQuickOptions);
exports.addMessageToMailReaderQuickQueue = function( message, callback ) {
  this.addMessageToQueue( mailReaderQuickQueue, QUEUE_NAME_MAIL_READER_QUICK, message, callback );
}
exports.pollMailReaderQuickQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  this.pollQueue( mailReaderQuickQueue, QUEUE_NAME_MAIL_READER_QUICK, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_MAIL_READER_QUICK] = {};


/*
  MailDownload Queue
  --------------------------------------
*/
var QUEUE_NAME_MAIL_DOWNLOAD = 'mailDownload';
var mailDownloadOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailDownloadQueue
}
var mailDownloadQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailDownloadOptions);
exports.addMessageToMailDownloadQueue = function( message, callback ) {
  this.addMessageToQueue( mailDownloadQueue, QUEUE_NAME_MAIL_DOWNLOAD, message, callback );
}
exports.pollMailDownloadQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  this.pollQueue( mailDownloadQueue, QUEUE_NAME_MAIL_DOWNLOAD, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_MAIL_DOWNLOAD] = {};


/*
  MailActiveConnection Queue
  --------------------------------------
*/
var QUEUE_NAME_MAIL_ACTIVE_CONNECTION = 'mailActiveConnection';
var mailActiveConnectionOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailActiveConnectionQueue
}
var mailActiveConnectionQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailActiveConnectionOptions);
exports.addMessageToMailActiveConnectionQueue = function( message, callback ) {
  this.addMessageToQueue( mailActiveConnectionQueue, QUEUE_NAME_MAIL_ACTIVE_CONNECTION, message, callback );
}
exports.pollMailActiveConnectionQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  this.pollQueue( mailActiveConnectionQueue, QUEUE_NAME_MAIL_ACTIVE_CONNECTION, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_MAIL_ACTIVE_CONNECTION] = {};


/*
  Worker Queue
  --------------------------------------
*/
var QUEUE_NAME_WORKER = 'Worker';
var workerOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsWorkerQueue
}
var workerQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, workerOptions);
exports.addMessageToWorkerQueue = function( message, callback ) {
  this.addMessageToQueue( workerQueue, QUEUE_NAME_WORKER, message, callback );
}
exports.pollWorkerQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  this.pollQueue( workerQueue, QUEUE_NAME_WORKER, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_WORKER] = {};


/*
  SQS/Queue Functions
  --------------------------------------
*/
exports.pollQueue = function( queue, queueName, handleMessageFunction, maxWorkersInput, workerTimeoutInput ) {

  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! queueName ) { winston.doMissingParamError('queueName'); return; }
  if ( ! handleMessageFunction ) { winston.doMissingParamError('handleMessageFunction'); return; }

  var maxWorkers = 1;
  if ( ! maxWorkersInput ) {
    winston.doWarn('no maxWorkers specified, assuming 1!');
  } else {
    maxWorkers = maxWorkersInput;
  }

  sqsConnect.addNewWorkers( maxWorkers, queue, queueName, maxWorkers, handleMessageFunction );

  var workerTimeout = constants.DEFAULT_WORKER_TIMEOUT;
  if ( workerTimeoutInput ) {
    workerTimeout = workerTimeoutInput;
  }

  var checkWorkersInterval  = setInterval( function() {
    sqsConnect.checkWorkers( queue, queueName, handleMessageFunction, maxWorkers, workerTimeout );
  }, constants.CHECK_WORKERS_INTERVAL );
}

exports.getMessageFromQueue = function( queue, queueName, callback ) {

  if ( ! queue ) { callback( winston.makeMissingParamError('queue') ); return; }
  if ( ! queueName ) { callback( winston.makeMissingParamError('queueName') ); return; }

  queue.call( "ReceiveMessage", {MaxNumberOfMessages : 1}, function ( sqsError, sqsMessage ) {
    if ( sqsError ) {
      callback( winston.makeError( 'sqs error from ReceiveMessage', {queueName: queueName, sqsError: sqsError, queue: queue} ) );

    } else {
      var messageBody = sqsConnect.getSQSMessageAttribute( sqsMessage, 'Body' );
      callback( null, messageBody, function( err ) {
        if ( err ) {
          winston.handleError( err );

        } else {
          var receiptHandle = sqsConnect.getSQSMessageAttribute( sqsMessage, 'ReceiptHandle' );
          if ( receiptHandle ) {
            sqsConnect.deleteMessageFromQueue( queue, queueName, sqsMessage );
          }
        }
      });
    }
  });
}

exports.addMessageToQueue = function( queue, queueName, message, callback ) {

  if ( ! queue ) { callback( winston.makeMissingParamError('queue') ); return; }
  if ( ! queueName ) { callback( winston.makeMissingParamError('queueName') ); return; }
  if ( ! message ) { callback( winston.makeMissingParamError('message') ); return; }

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

exports.deleteMessageFromQueue = function( queue, queueName, sqsMessage ) {
  
  var receiptHandle = sqsConnect.getSQSMessageAttribute(sqsMessage, 'ReceiptHandle');

  if ( ! receiptHandle ) {
    winston.doError('missing receipt handle', {sqsMessage: sqsMessage, queueName: queueName} );
    return;
  }

  var outbound = {
    ReceiptHandle: receiptHandle
  };
  //winston.info('deleting message from queue...', receiptHandle);
  queue.call( "DeleteMessage", outbound, function (err) {
    if ( err ) {
      winston.doError('got error from DeleteMessage', {err: err, queueName: queueName});
    } else {
      var message = sqsConnect.getSQSMessageAttribute(sqsMessage, 'Body');
      winston.doInfo('deleted message from queue', {message: message, queueName: queueName});
    }
  });
}

exports.getSQSMessageAttribute = function( sqsMessage, attribute ) {
  if ( sqsMessage
    && sqsMessage.ReceiveMessageResult 
    && sqsMessage.ReceiveMessageResult.Message
    && sqsMessage.ReceiveMessageResult.Message[attribute] ) {
    return sqsMessage.ReceiveMessageResult.Message[attribute];
  }
  return null;
}





/*
  Worker Functions
  --------------------------------------
*/

//A 'miss' is either an sqs error or 'no message'.
exports.workQueue = function( workerId, queue, queueName, maxWorkers, handleMessageFunction, previousConsecutiveMisses ) {

  if ( ! workerId ) { winston.doMissingParamError('workerId'); return; }
  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! queueName ) { winston.doMissingParamError('queueName'); return; }
  if ( ! maxWorkers ) { winston.doMissingParamError('maxWorkers'); return; }
  if ( ! handleMessageFunction ) { winston.doMissingParamError('handleMessageFunction'); return; }

  //winston.doInfo('working queue...', {queueName: queueName});
  if ( ! sqsConnect.isRoomToWork( queue, queueName, maxWorkers ) ) {
    winston.doWarn('No room to work!  Stopping.', {queueName: queueName, workerId: workerId});

  } else {
    sqsConnect.udpateWorkerLastContactTime( workerId, queue, queueName, maxWorkers, handleMessageFunction );

    sqsConnect.getMessageFromQueue( queue, queueName, function( err, messageBody, messageCallback ) {
      if ( err ) {
        winston.handleError( err );
        sqsConnect.reworkQueue( workerId, queue, queueName, maxWorkers, handleMessageFunction, true, previousConsecutiveMisses );

      } else if ( ! messageBody ) {
        sqsConnect.reworkQueue( workerId, queue, queueName, maxWorkers, handleMessageFunction, true, previousConsecutiveMisses );

      } else {
        handleMessageFunction( messageBody, function(err) {
          messageCallback( err );
          sqsConnect.reworkQueue( workerId, queue, queueName, maxWorkers, handleMessageFunction );
        });
      }
    });
  }
}

//A 'miss' is either an sqs error or 'no message'.
exports.reworkQueue = function( workerId, queue, queueName, maxWorkers, handleMessageFunction, isMiss, previousConsecutiveMisses ) {

  if ( ! workerId ) { winston.doMissingParamError('workerId'); return; }
  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! queueName ) { winston.doMissingParamError('queueName'); return; }
  if ( ! maxWorkers ) { winston.doMissingParamError('maxWorkers'); return; }
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
    sqsConnect.workQueue( workerId, queue, queueName, maxWorkers, handleMessageFunction, newConsecutiveMisses, maxWorkers );
  }, waitTime );
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

exports.checkWorkers = function( queue, queueName, handleMessageFunction, maxWorkers, workerTimeout ) {

  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! queueName ) { winston.doMissingParamError('queueName'); return; }
  if ( ! handleMessageFunction ) { winston.doMissingParamError('handleMessageFunction'); return; }
  if ( ! maxWorkers ) { winston.doMissingParamError('maxWorkers'); return; }
  if ( ! workerTimeout ) { winston.doMissingParamError('workerTimeout'); return; }

  if ( ! workers[queueName] )  {
    winston.doError('No worker queue!', {queueName: queueName});

  } else {
    var numWorkers = 0;
    for ( var workerId in workers[queueName] ) {
      var workerInfo = workers[queueName][workerId];

      var lastContactTime = workerInfo['lastContactTime'];
      var elapsedTime = Date.now() - lastContactTime;

      if ( elapsedTime > workerTimeout ) {
        winston.doError('worker timed out! deleting worker.', {queueName: queueName, workerId: workerId, elapsedTime: elapsedTime, workerTimeout: workerTimeout});
        delete workers[queueName][workerId];

      } else {
        numWorkers++;
      }
    }

    winston.doInfo('checkWorkers', {queueName: queueName, numWorkers: numWorkers});

    if ( numWorkers < maxWorkers ) {
      var newWorkersNeeded = maxWorkers - numWorkers;
      sqsConnect.addNewWorkers( newWorkersNeeded, queue, queueName, maxWorkers, handleMessageFunction );
    }
  }
}

exports.addNewWorkers = function( numWorkers, queue, queueName, maxWorkers, handleMessageFunction ) {

  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! queueName ) { winston.doMissingParamError('queueName'); return; }
  if ( ! maxWorkers ) { winston.doMissingParamError('maxWorkers'); return; }
  if ( ! handleMessageFunction ) { winston.doMissingParamError('handleMessageFunction'); return; }

  if ( ( ! numWorkers ) || ( ! ( numWorkers > 0 ) ) ) {
    winston.doWarn('sqsConnect: addWorkers: no numWorkers specified, not adding any', {queueName: queueName});

  } else {
    for ( var i=0; i<numWorkers; i++ ) {
      sqsConnect.addNewWorker( queue, queueName, maxWorkers, handleMessageFunction );
    }
  }
}

exports.addNewWorker = function( queue, queueName, maxWorkers, handleMessageFunction ) {

  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! queueName ) { winston.doMissingParamError('queueName'); return; }
  if ( ! maxWorkers ) { winston.doMissingParamError('maxWorkers'); return; }
  if ( ! handleMessageFunction ) { winston.doMissingParamError('handleMessageFunction'); return; }

  var workerId = utils.getUniqueId();
  sqsConnect.addWorker( workerId, queue, queueName, maxWorkers, handleMessageFunction );
}

exports.addWorker = function( workerId, queue, queueName, maxWorkers, handleMessageFunction ) {

  if ( ! workerId ) { winston.doMissingParamError('workerId'); return; }
  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! queueName ) { winston.doMissingParamError('queueName'); return; }
  if ( ! maxWorkers ) { winston.doMissingParamError('maxWorkers'); return; }
  if ( ! handleMessageFunction ) { winston.doMissingParamError('handleMessageFunction'); return; }
  
  winston.doInfo('Starting queue worker...', {queueName: queueName, workerId: workerId});

  if ( ! workers[queueName] ) {
    winston.doMissingParamError('workers[queueName]', {queueName: queueName});
    return;
  }

  var workerInfo = {
    lastContactTime: Date.now()
  }
  workers[queueName][workerId] = workerInfo;
  setTimeout( function() {
    sqsConnect.workQueue( workerId, queue, queueName, maxWorkers, handleMessageFunction );
  }, 0 );
}

//Assumes that the caller is already working, so he is included in the current count of workers.
exports.isRoomToWork = function( queue, queueName, maxWorkers ) {

  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! queueName ) { winston.doMissingParamError('queueName'); return; }
  if ( ! maxWorkers ) { winston.doMissingParamError('maxWorkers'); return; }

  if ( ! workers[queueName] ) {
    winston.doError('no queue!', {queueName: queueName});

  } else {
    var numWorkersOnQueue = sqsConnect.getNumWorkersOnQueue( queueName );
    if ( ! ( numWorkersOnQueue > 0 ) ) {
      winston.doWarn('No workers on queue!  Should be at least 1 since it includes ourselves.', {queueName: queueName});

    } else {
      //Subtract 1 to allow for ourselves (the caller)
      var numOtherWorkers = numWorkersOnQueue - 1;
      if ( numOtherWorkers < maxWorkers ) {
        return true;
      }
    }
  }
  return false;
}

exports.getNumWorkersOnQueue = function( queueName ) {
  if ( ! queueName ) { winston.doMissingParamError('queueName'); return 0; }
  var numWorkersOnQueue = Object.keys( workers[queueName] ).length;
  return numWorkersOnQueue;
}

exports.udpateWorkerLastContactTime = function( workerId, queue, queueName, maxWorkers, handleMessageFunction ) {
  
  if ( ! workerId ) { winston.doMissingParamError('workerId'); return; }
  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! queueName ) { winston.doMissingParamError('queueName'); return; }
  if ( ! maxWorkers ) { winston.doMissingParamError('maxWorkers'); return; }
  if ( ! handleMessageFunction ) { winston.doMissingParamError('handleMessageFunction'); return; }

  var numWorkersOnQueue = sqsConnect.getNumWorkersOnQueue( queueName );
  if ( ! ( numWorkersOnQueue > 0 ) ) {
    winston.doError('No workers for queue!', {queueName: queueName, workerId: workerId});

  } else if ( ! workers[queueName][workerId] ) {
      winston.doError('Worker not found! Re-adding worker.', {queueName: queueName, workerId: workerId});
      sqsConnect.addWorker( workerId, queue, queueName, maxWorkers, handleMessageFunction );

  } else {
    workers[queueName][workerId]['lastContactTime'] = Date.now();
  }
}