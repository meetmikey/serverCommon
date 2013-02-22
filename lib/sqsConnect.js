var conf = require ('../conf')
  , aws = require ('aws-lib')
  , winston = require ('./winstonWrapper').winston


// See "http://docs.amazonwebservices.com/AWSSimpleQueueService/latest/APIReference/"
// General SQS actions do not require a "path" (CreateQueue, ListQueue, etc)

// Specific Queue options (CreateMessage, DeleteMessage, ReceiveMessage etc)
// need a specific path 
// http://sqs.us-east-1.amazonaws.com/123456789012/testQueue/
// /accountid/queue_name
var mailReaderOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailReadingQueue;
}

var mailDownloadOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailDownloadQueue;
}

var mailUpdateOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailUpdateQueue;
}

var mailReaderQuickOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailReadingQuickQueue;
}

var sqsConnect = this;

var mailReaderQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailReaderOptions);
var mailReaderQuickQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailReaderQuickOptions);
var mailDownloadQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailDownloadOptions);
var mailUpdateQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailUpdateOptions);
var currentNumObjects = 0

exports.addMessageToQueue = function (queue, message, callback) {
  var messageString = JSON.stringify(message)
  var outbound = {
    MessageBody : messageString  
  }
  queue.call( "SendMessage", outbound, function (err, result ) {
    winston.info('sent message to queue', {message: message});

    if (callback) {
      callback (err, result)
    }

  })
}

exports.getMessageFromQueue = function(queue, callback) {

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
        currentNumObjects-= 1

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

exports.pollQueue = function(queue, handleMessage, maxObjects) {

  //winston.info('pollQueue running...');

  sqsConnect.getMessageFromQueue(queue, function(err, message, doneWithMessageCallback) {
    if ( err ) {
      winston.doError('received error from getMessageFromQueue', {err: err});
    } 
    else {

      if (message) {
        currentNumObjects += 1
      
        handleMessage(message, function(err) {

          //Assuming that the message handler did the appropriate logging of the error

          if ( ! err ) {
            //winston.info('delete message callback');
            doneWithMessageCallback(err);
          }
        });
      }

      //winston.info('pollQueue', {currentNumObject: currentNumObjects, maxObjects: maxObjects});

      if (currentNumObjects < maxObjects && message) {
        winston.info('polling for new obj');
        sqsConnect.pollQueue(queue, handleMessage, maxObjects);
      }
      else {
        
        // check every second to see if we should start polling again
        var intervalId = setInterval (function () {
          winston.info('check whether to start polling again');
          if (currentNumObjects < maxObjects) {
            winston.info('start polling again', {intervalId: intervalId})
            clearInterval(intervalId) // stop doing this loop
            sqsConnect.pollQueue(queue, handleMessage, maxObjects);
          }
        }, 5000);
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


exports.pollMailReaderQueue = function( handleMessage, maxHandlers ) {
  this.pollQueue( mailReaderQueue, handleMessage, maxHandlers);
}

exports.pollMailReaderQuickQueue = function( handleMessage, maxHandlers ) {
  this.pollQueue( mailReaderQuickQueue, handleMessage, maxHandlers);
}

exports.pollMailDownloadQueue = function( handleMessage, maxObjects ) {
  this.pollQueue( mailDownloadQueue, handleMessage, maxObjects );
}

exports.pollMailUpdateQueue = function ( handleMessage, maxObjects ) {
  this.pollQueue( mailUpdateQueue, handleMessage, maxObjects );
}
