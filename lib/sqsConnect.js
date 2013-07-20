var conf = require ('../conf')
  , aws = require ('aws-lib')
  , winston = require ('./winstonWrapper').winston
  , constants = require ('../constants')
  , QueueFailModel = require ('../schema/queueFail').QueueFailModel
  , utils = require('./utils')
  , sesUtils = require ('./sesUtils')
  , async = require('async');

var sqsConnect = this;

// See "http://docs.amazonwebservices.com/AWSSimpleQueueService/latest/APIReference/"
// General SQS actions do not require a "path" (CreateQueue, ListQueue, etc)

// Specific Queue options (CreateMessage, DeleteMessage, ReceiveMessage etc)
// need a specific path 
// http://sqs.us-east-1.amazonaws.com/123456789012/testQueue/
// /accountid/queue_name


var workers = {};
var checkWorkersIntervals = {};

var awsAccountId = conf.aws.accountID;
var awsKey = conf.aws.key;
var awsSecret = conf.aws.secret;

var stopSignalReceived = false;
exports.stopSignal = function() {
  stopSignalReceived = true;
  conf.turnDebugModeOn();
  winston.doInfo('SQS: Received stop signal');
}

/*
  MailReader Queue
  --------------------------------------
*/
var QUEUE_NAME_MAIL_READER = 'mailReader';
var mailReaderOptions = {
  "path" : '/' + awsAccountId + '/' + conf.aws.sqsMailReadingQueue
}
var mailReaderQueue = aws.createSQSClient( awsKey, awsSecret, mailReaderOptions );
exports.addMessageToMailReaderQueue = function( message, callback ) {
  sqsConnect.addMessageToQueue( mailReaderQueue, QUEUE_NAME_MAIL_READER, message, callback );
}
exports.pollMailReaderQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  sqsConnect.pollQueue( mailReaderQueue, QUEUE_NAME_MAIL_READER, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_MAIL_READER] = {};


/*
  MailReaderQuick Queue
  --------------------------------------
*/
var QUEUE_NAME_MAIL_READER_QUICK = 'mailReaderQuick';
var mailReaderQuickOptions = {
  "path" : '/' + awsAccountId + '/' + conf.aws.sqsMailReadingQuickQueue
}
var mailReaderQuickQueue = aws.createSQSClient( awsKey, awsSecret, mailReaderQuickOptions );
exports.addMessageToMailReaderQuickQueue = function( message, callback ) {
  sqsConnect.addMessageToQueue( mailReaderQuickQueue, QUEUE_NAME_MAIL_READER_QUICK, message, callback );
}
exports.pollMailReaderQuickQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  sqsConnect.pollQueue( mailReaderQuickQueue, QUEUE_NAME_MAIL_READER_QUICK, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_MAIL_READER_QUICK] = {};


/*
  MailDownload Queue
  --------------------------------------
*/
var QUEUE_NAME_MAIL_DOWNLOAD = 'mailDownload';
var mailDownloadOptions = {
  "path" : '/' + awsAccountId + '/' + conf.aws.sqsMailDownloadQueue
}
var mailDownloadQueue = aws.createSQSClient( awsKey, awsSecret, mailDownloadOptions );
exports.addMessageToMailDownloadQueue = function( message, callback ) {
  sqsConnect.addMessageToQueue( mailDownloadQueue, QUEUE_NAME_MAIL_DOWNLOAD, message, callback );
}
exports.pollMailDownloadQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  sqsConnect.pollQueue( mailDownloadQueue, QUEUE_NAME_MAIL_DOWNLOAD, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_MAIL_DOWNLOAD] = {};


/*
  MailActiveConnection Queue
  --------------------------------------
*/
var QUEUE_NAME_MAIL_ACTIVE_CONNECTION = 'mailActiveConnection';
var mailActiveConnectionOptions = {
  "path" : '/' + awsAccountId + '/' + conf.aws.sqsMailActiveConnectionQueue
}
var mailActiveConnectionQueue = aws.createSQSClient( awsKey, awsSecret, mailActiveConnectionOptions );
exports.addMessageToMailActiveConnectionQueue = function( message, callback ) {
  sqsConnect.addMessageToQueue( mailActiveConnectionQueue, QUEUE_NAME_MAIL_ACTIVE_CONNECTION, message, callback );
}
exports.pollMailActiveConnectionQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  sqsConnect.pollQueue( mailActiveConnectionQueue, QUEUE_NAME_MAIL_ACTIVE_CONNECTION, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_MAIL_ACTIVE_CONNECTION] = {};


/*
  Worker Queue
  --------------------------------------
*/
var QUEUE_NAME_WORKER = 'Worker';
var workerOptions = {
  "path" : '/' + awsAccountId + '/' + conf.aws.sqsWorkerQueue
}
var workerQueue = aws.createSQSClient( awsKey, awsSecret, workerOptions );
exports.addMessageToWorkerQueue = function( message, callback ) {
  sqsConnect.addMessageToQueue( workerQueue, QUEUE_NAME_WORKER, message, callback );
}
exports.pollWorkerQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  sqsConnect.pollQueue( workerQueue, QUEUE_NAME_WORKER, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_WORKER] = {};

/*
  Worker (Reindex) Queue
  --------------------------------------
*/
var QUEUE_NAME_WORKER_REINDEX = 'WorkerReindex';
var workerReindexOptions = {
  "path" : '/' + awsAccountId + '/' + conf.aws.sqsWorkerReindexQueue
}
var workerReindexQueue = aws.createSQSClient( awsKey, awsSecret, workerReindexOptions);
exports.addMessageToWorkerReindexQueue = function( message, callback ) {
  sqsConnect.addMessageToQueue( workerReindexQueue, QUEUE_NAME_WORKER_REINDEX, message, callback );
}
exports.pollWorkerReindexQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  sqsConnect.pollQueue( workerReindexQueue, QUEUE_NAME_WORKER_REINDEX, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_WORKER_REINDEX] = {};


/*
  Cache Invalidation Queue
  --------------------------------------
*/
var QUEUE_NAME_CACHE_INVALIDATION = 'CacheInvalidation';
var cacheInvalidationOptions = {
  "path" : '/' + awsAccountId + '/' + conf.aws.sqsCacheInvalidationQueue
}
var cacheInvalidationQueue = aws.createSQSClient( awsKey, awsSecret, cacheInvalidationOptions );
exports.addMessageToCacheInvalidationQueue = function( message, callback ) {
  sqsConnect.addMessageToQueue( cacheInvalidationQueue, QUEUE_NAME_CACHE_INVALIDATION, message, callback );
}
exports.pollCacheInvalidationQueue = function( handleMessage, maxWorkers, workerTimeout ) {
  sqsConnect.pollQueue( cacheInvalidationQueue, QUEUE_NAME_CACHE_INVALIDATION, handleMessage, maxWorkers, workerTimeout );
}
workers[QUEUE_NAME_CACHE_INVALIDATION] = {};

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

  if ( checkWorkersIntervals[queueName] ) {
    winston.doWarn('sqsConnect: pollQueue: existing pollQueue interval for queue', {queueName: queueName});

  } else {
    checkWorkersIntervals[queueName] = setInterval( function() {
      if ( ( ! stopSignalReceived ) || ( sqsConnect.getNumTotalWorkers() > 0 ) ) {
        sqsConnect.checkWorkers( queue, queueName, handleMessageFunction, maxWorkers, workerTimeout );
      }
    }, constants.CHECK_WORKERS_INTERVAL );
  }
}

exports.getMessageFromQueue = function( queue, queueName, callback ) {
  utils.runWithRetries( sqsConnect.getMessageFromQueueNoRetry, constants.SQS_RETRIES, callback, queue, queueName );
}

exports.getMessageFromQueueNoRetry = function( queue, queueName, callback ) {

  if ( ! queue ) { callback( winston.makeMissingParamError('queue') ); return; }
  if ( ! queueName ) { callback( winston.makeMissingParamError('queueName') ); return; }

  queue.call( "ReceiveMessage", 
    {MaxNumberOfMessages : 1, "AttributeName" : "All"}, 
    function ( sqsError, sqsMessage ) {
    if ( sqsError ) {
      callback( winston.makeError( 'sqs error from ReceiveMessage', {queueName: queueName, sqsError: sqsError.toString()} ) );

    } else {

      var attrArray = sqsConnect.getSQSMessageAttribute (sqsMessage, 'Attribute');
      // check approximate receive count - if over a certain threshold delete the message
      var tooManyDequeues = false;

      if (attrArray) {

        attrArray.forEach (function (values) {
          if (values.Name == 'ApproximateReceiveCount') {
            var receiveCount = parseInt(values.Value, 10);
            if (receiveCount > constants.QUEUE_MAX_MESSAGE_RECEIVE_COUNT) {
              tooManyDequeues = true;
            }
          }
        });
      }

      if (tooManyDequeues) {

        var fail = new QueueFailModel ({
          queueName : queueName,
          body : JSON.stringify (sqsConnect.getSQSMessageAttribute( sqsMessage, 'Body' ))
        });

        fail.save (function (err) {
          if (err) {
            winston.doMongoError (err);
          } else {
            // delete the message
            winston.doError ('Not processing and deleting queue message b/c it has been requeued too many times', {msg : sqsMessage});

            if (queueName === 'mailDownload') {
              var body = JSON.stringify (sqsConnect.getSQSMessageAttribute( sqsMessage, 'Body' );
              sesUtils.sendInternalNotificationEmail (body, 'mailDownload job failed 25 times!! Onboarding user fail!', function (err) {
                if (err) { winston.doError ('Error sending notification email', {err : err}); }
              });
            }

            sqsConnect.deleteMessageFromQueue( queue, queueName, sqsMessage, function () {
              callback ();
            });
          }

        });

      } else {
        var messageBody = sqsConnect.getSQSMessageAttribute( sqsMessage, 'Body' );
        callback( null, messageBody, function( err,  deleteMessageCB) {

          var receiptHandle = sqsConnect.getSQSMessageAttribute( sqsMessage, 'ReceiptHandle' );
          var deleteFromQueue = false;
          if ( err ) {

            // if this flag is set we can delete from queue despite
            // calling back with an error
            var deleteFlag = winston.getDeleteFromQueueFlag (err);
            if (deleteFlag && deleteFlag === true) {
              deleteFromQueue = true;
            }

            var printError = true;

            // if this flag is set we want to suppress the error
            // from the logs (i.e. we dont want to handleError)
            var suppressQueueErrorFlag = winston.getSuppressQueueErrorFlag (err);
            if (suppressQueueErrorFlag) {
              printError = false;
            }

            if (printError) {
              winston.handleError( err );
            }

          } else {
            deleteFromQueue = true;
          }

          if ( receiptHandle && deleteFromQueue) {
            sqsConnect.deleteMessageFromQueue( queue, queueName, sqsMessage, deleteMessageCB );
          } else {
            // here we call this so we can get a new message anyway despite the fact that
            // we have opted not to delete the message from the queue
            deleteMessageCB ();
          }

        });
      }

    }
  });
}

exports.addMessageToQueue = function( queue, queueName, message, callback ) {
  utils.runWithRetries( sqsConnect.addMessageToQueueNoRetry, constants.SQS_RETRIES, callback, queue, queueName, message );
}

exports.addMessageToQueueNoRetry = function( queue, queueName, message, callback ) {

  if ( ! queue ) { callback( winston.makeMissingParamError('queue') ); return; }
  if ( ! queueName ) { callback( winston.makeMissingParamError('queueName') ); return; }
  if ( ! message ) { callback( winston.makeMissingParamError('message') ); return; }

  var messageBody = JSON.stringify( message );
  var sqsMessage = {
    MessageBody : messageBody  
  };
  queue.call( 'SendMessage', sqsMessage, function( sqsError, result ) {
    //winston.doInfo( 'Sent message to queue', {messageBody: messageBody} );
    if ( callback ) {
      var winstonError = null;
      if ( sqsError ) {
        sqsErrorMessage = sqsError.toString();
        winstonError = winston.makeError('sqs send message error', {sqsError: sqsErrorMessage, queueName: queueName} );
      }
      callback( winstonError, result );
    }
  });
}

exports.deleteMessageFromQueue = function( queue, queueName, sqsMessage, callback ) {
  utils.runWithRetries( sqsConnect.deleteMessageFromQueueNoRetry, constants.SQS_RETRIES, callback, queue, queueName, sqsMessage );
}

exports.deleteMessageFromQueueNoRetry = function( queue, queueName, sqsMessage, callback ) {
  
  var receiptHandle = sqsConnect.getSQSMessageAttribute(sqsMessage, 'ReceiptHandle');

  if ( ! receiptHandle ) {
    winston.doError('missing receipt handle', {sqsMessage: sqsMessage, queueName: queueName} );
    return;
  }

  var outbound = {
    ReceiptHandle: receiptHandle
  };
  //winston.doInfo('deleting message from queue...', {receiptHandle: receiptHandle});
  queue.call( "DeleteMessage", outbound, function (sqsError) {
    if ( sqsError ) {
      winston.doError('got error from DeleteMessage', {sqsError: sqsError, queueName: queueName});
      callback ();
    } else {
      var message = sqsConnect.getSQSMessageAttribute(sqsMessage, 'Body');
      winston.doInfo('deleted message from queue', {message: message, queueName: queueName});
      callback ();
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
  if ( stopSignalReceived ) {
    winston.doInfo('Stopping worker', {workerId: workerId, queueName: queueName});
    sqsConnect.deleteWorker( queueName, workerId );

  } else if ( ! sqsConnect.isRoomToWork( queue, queueName, maxWorkers ) ) {
    winston.doWarn('No room to work!  Stopping.', {queueName: queueName, workerId: workerId});

  } else {
    sqsConnect.updateWorkerLastContactTime( workerId, queue, queueName, maxWorkers, handleMessageFunction, true );
    var hasCalledBack = false;

    sqsConnect.getMessageFromQueue( queue, queueName, function( err, messageBody, messageCallback ) {
      sqsConnect.updateWorkerLastContactTime( workerId, queue, queueName, maxWorkers, handleMessageFunction );
      if ( err ) {
        winston.handleError( err );
        sqsConnect.reworkQueue( workerId, queue, queueName, maxWorkers, handleMessageFunction, true, previousConsecutiveMisses );

      } else if ( ! messageBody ) {
        sqsConnect.reworkQueue( workerId, queue, queueName, maxWorkers, handleMessageFunction, true, previousConsecutiveMisses );

      } else {
        workers[queueName][workerId]['messageBody'] = messageBody;
        handleMessageFunction( messageBody, function(err) {
          if (workers[queueName][workerId]) {
            workers[queueName][workerId]['messageBody'] = null;
          }

          if (!hasCalledBack) {
            messageCallback( err, function () {
              sqsConnect.reworkQueue( workerId, queue, queueName, maxWorkers, handleMessageFunction );
            });
            hasCalledBack = true;
          } else {
            winston.doError ('Double callback to workQueue handleMessageFunction');
          }
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
      var messageBody = workerInfo['messageBody'];

      if ( elapsedTime > workerTimeout ) {
        var errorData = {
            queueName: queueName
          , workerId: workerId
          , elapsedTime: elapsedTime
          , workerTimeout: workerTimeout
          , messageBody: messageBody
        };
        winston.doError('worker timed out! deleting worker.', errorData);
        sqsConnect.deleteWorker( queueName, workerId );

      } else {
        numWorkers++;
      }
    }

    winston.doInfo('checkWorkers', {queueName: queueName, numWorkers: numWorkers});

    if ( ( ! stopSignalReceived ) && ( numWorkers < maxWorkers ) ) {
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

exports.deleteWorker = function( queueName, workerId ) {

  if ( ! queueName ) { winston.doMissingParamError('queueName'); return; }
  if ( ! workerId ) { winston.doMissingParamError('workerId'); return; }

  delete workers[queueName][workerId];

  if ( stopSignalReceived && ( sqsConnect.getNumTotalWorkers() == 0 ) ) {
    if ( checkWorkersIntervals[queueName] ) {
      clearInterval( checkWorkersIntervals[queueName] );
      delete checkWorkersIntervals[queueName];
    }
    winston.doInfo('All workers done.');
    //process.exit(0);
  }
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

exports.getNumTotalWorkers = function() {
  var totalWorkers = 0;
  for ( var queueName in workers ) {
    totalWorkers += sqsConnect.getNumWorkersOnQueue( queueName );
  }
  return totalWorkers;
}

exports.updateWorkerLastContactTime = function( workerId, queue, queueName, maxWorkers, handleMessageFunction, addIfMissing ) {
  
  if ( ! workerId ) { winston.doMissingParamError('workerId'); return; }
  if ( ! queue ) { winston.doMissingParamError('queue'); return; }
  if ( ! queueName ) { winston.doMissingParamError('queueName'); return; }
  if ( ! maxWorkers ) { winston.doMissingParamError('maxWorkers'); return; }
  if ( ! handleMessageFunction ) { winston.doMissingParamError('handleMessageFunction'); return; }

  var numWorkersOnQueue = sqsConnect.getNumWorkersOnQueue( queueName );
  if ( ! ( numWorkersOnQueue > 0 ) ) {
    winston.doError('No workers for queue!', {queueName: queueName, workerId: workerId});

  } else if ( ! workers[queueName][workerId] ) {
    if ( addIfMissing ) {
      winston.doWarn('Worker not found! Re-adding worker.', {queueName: queueName, workerId: workerId});
      sqsConnect.addWorker( workerId, queue, queueName, maxWorkers, handleMessageFunction );
    }

  } else {
    workers[queueName][workerId]['lastContactTime'] = Date.now();
  }
}
