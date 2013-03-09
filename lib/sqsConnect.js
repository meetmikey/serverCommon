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

var mailUpdateOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailUpdateQueue
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
var mailUpdateQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailUpdateOptions);
var mailActiveConnectionQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailActiveConnectionOptions);

var currentNumObjects = {
  'mailReaderQueue' : 0,
  'mailReaderQuickQueue' : 0,
  'mailDownloadQueue' : 0,
  'mailUpdateQueue' : 0,
  'mailActiveConnectionQueue' : 0
}

exports.addMessageToQueue = function (queue, message, callback) {
  var messageString = JSON.stringify(message)
  var outbound = {
    MessageBody : messageString  
  }
  queue.call( "SendMessage", outbound, function (err, result ) {
    winston.info('sent message to queue', {message: messageString});

    if (callback) {
      callback (err, result)
    }

  })
}

exports.getMessageFromQueue = function(queue, queueString, callback) {

  //winston.info('about to get message...');

  queue.call( "ReceiveMessage", {MaxNumberOfMessages : 1}, function (err, sqsMessage) {
    if ( err ) {
      winston.doError('got error from ReceiveMessage', {err: err});
      callback(err);

    } else {
      var message = sqsConnect.getSQSMessageAttribute(sqsMessage, 'Body');
      callback(null, message, doneWithMessageCallback)

      function doneWithMessageCallback (err) {
        // always decrement since we are done handling
        winston.doInfo ('decrementing num objects for ', {name : queueString});
        currentNumObjects[queueString] -= 1;

        if ( err ) {
          winston.doError('got error from message handling callback', {err: err});
          //winston.info('due to error, leaving message on queue...');
        } else {
          var receiptHandle = sqsConnect.getSQSMessageAttribute(sqsMessage, 'ReceiptHandle');
          if ( receiptHandle ) {
            sqsConnect.deleteMessageFromQueue( queue, sqsMessage );
          }
        }
      }
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

// TODO: does this create a potentially really long call stack?
exports.pollQueue = function(queue, handleMessage, maxObjects, queueString, checkInterval) {

  winston.info('pollQueue', {queue : queueString, currentNumObject: currentNumObjects[queueString], maxObjects: maxObjects, checkInterval : checkInterval});

  sqsConnect.getMessageFromQueue(queue, queueString, function(err, message, doneWithMessageCallback) {
    if ( err ) {
      winston.doError('received error from getMessageFromQueue', {err: err});
    } 
    else {

      if (message) {
        winston.doInfo ('incrementing num objects for ', {name : queueString});
        currentNumObjects[queueString] += 1;
      
        console.log (currentNumObjects);

        handleMessage(message, function(err) {

          winston.doInfo ('handleMessage', {err : err});
          //Assuming that the message handler did the appropriate logging of the error

          if ( ! err ) {
            winston.info('delete message callback');
            doneWithMessageCallback(err);
          }
        });
      }


      if (currentNumObjects[queueString] < maxObjects && message) {
        winston.info('polling for new object ' + queueString);
        //TODO: this is a hack to prevent long callstack
        setTimeout (function () {
          sqsConnect.pollQueue(queue, handleMessage, maxObjects, queueString, checkInterval); 
        }, 0);
      }
      else {
        
        // check whether to start polling again every checkInterval
        var intervalId = setInterval (function () {
          if (currentNumObjects[queueString] < maxObjects) {
            winston.info('polling for new obj after interval ' + queueString);
            clearInterval(intervalId) // stop doing this loop
            sqsConnect.pollQueue(queue, handleMessage, maxObjects, queueString, checkInterval);
          }
        }, checkInterval);
      }
    }
  });
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

exports.addMessageToMailUpdateQueue = function (message, callback) {
  this.addMessageToQueue(mailUpdateQueue, message, callback);
}

exports.addMessageToMailActiveConnectionQueue = function (message, callback) {
  this.addMessageToQueue(mailActiveConnectionQueue, message, callback);
}

exports.pollMailReaderQueue = function( handleMessage, maxObjects ) {
  if (!sqsConnect.checkParamMaxObjects (maxObjects, 'pollMailReaderQueue')) { return; }
  this.pollQueue( mailReaderQueue, handleMessage, maxObjects, 'mailReaderQueue', constants.MAIL_READER_CHECK_INTERVAL);
}

exports.pollMailReaderQuickQueue = function( handleMessage, maxObjects ) {
  if (!sqsConnect.checkParamMaxObjects (maxObjects, 'pollMailReaderQuickQueue')) { return; }
  this.pollQueue( mailReaderQuickQueue, handleMessage, maxObjects, 'mailReaderQuickQueue', constants.MAIL_READER_QUICK_CHECK_INTERVAL);
}

exports.pollMailDownloadQueue = function( handleMessage, maxObjects ) { 
  if (!sqsConnect.checkParamMaxObjects (maxObjects, 'pollMailDownloadQueue')) { return; }
  this.pollQueue( mailDownloadQueue, handleMessage, maxObjects, 'mailDownloadQueue', constants.MAIL_DOWNLOAD_CHECK_INTERVAL );
}

exports.pollMailUpdateQueue = function ( handleMessage, maxObjects ) {
  if (!sqsConnect.checkParamMaxObjects (maxObjects, 'pollMailActiveConnectionQueue')) { return; }
  this.pollQueue( mailUpdateQueue, handleMessage, maxObjects, 'mailUpdateQueue', constants.MAIL_UPDATE_CHECK_INTERVAL );
}

exports.pollMailActiveConnectionQueue = function ( handleMessage, maxObjects ) {
  if (!sqsConnect.checkParamMaxObjects (maxObjects, 'pollMailActiveConnectionQueue')) { return; }
  this.pollQueue( mailActiveConnectionQueue, handleMessage, maxObjects, 'mailActiveConnectionQueue', constants.ACTIVE_CONNECTIONS_CHECK_INTERVAL );
}

exports.checkParamMaxObjects = function (maxObjects, queue) {
  if (!maxObjects){
    winston.doError ('Must define parameter maxObjects', {functionName : queue, maxObjects : maxObjects});
  }

  return maxObjects;
}