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
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailReadingQueue
};

var mailDownloadOptions = {
  "path" : '/' + conf.aws.accountID + '/' + conf.aws.sqsMailDownloadQueue
}

var sqsConnect = this;

var mailReaderQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailReaderOptions);
var mailDownloadQueue = aws.createSQSClient(conf.aws.key, conf.aws.secret, mailDownloadOptions);
var currentNumObjects = 0

exports.addMessageToQueue = function (queue, message) {
  var messageString = JSON.stringify(message)
  var outbound = {
    MessageBody : messageString  
  }
  queue.call( "SendMessage", outbound, function (err, result ) {
    //winston.info('sent message to queue: ', message);
  })
}

exports.getMessageFromQueue = function(queue, callback) {

  //winston.info('about to get message...');

  queue.call( "ReceiveMessage", {MaxNumberOfMessages : 1}, function (err, sqsMessage) {
    if ( err ) {
      winston.error('getMessageFromQueue: got error from ReceiveMessage: ', err);
      callback(err);
    } else {
      var message = sqsConnect.getSQSMessageAttribute(sqsMessage, 'Body');
      callback(null, message, doneWithMessageCallback)


      function doneWithMessageCallback (err) {
        // always decrement since we are done handling
        currentNumObjects-= 1

        if ( err ) {
          winston.error('getMessageFromQueue: got error from message handling callback: ', err);
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

  winston.info('pollQueue running...');

  sqsConnect.getMessageFromQueue(queue, function(err, message, doneWithMessageCallback) {
    if ( err ) {
      winston.error('pollQueue: received error from getMessageFromQueue: ' + err);
    } 
    else {

      if (message) {
        currentNumObjects += 1
      
        handleMessage(message, function(err) {

          if ( err ) {
            winston.error('pollQueue: got error from handleMessage: ', err);
          }

          winston.info('delete message callback')
          doneWithMessageCallback(err);

        });

      }

      winston.info('currentNum', currentNumObjects)
      winston.info('maxNum', maxObjects)

      if (currentNumObjects < maxObjects) {
        winston.info('polling for new obj')
        sqsConnect.pollQueue(queue, handleMessage, maxObjects);
      }
      else {
        
        // check every second to see if we should start polling again
        var intervalId = setInterval (function () {
          winston.info('check whether to start polling again')
          if (currentNumObjects < maxObjects) {
            winston.info('start polling again', intervalId)
            clearInterval(intervalId) // stop doing this loop
            sqsConnect.pollQueue(queue, handleMessage, maxObjects);
          }
        }, 1000)
        
      }

    }
  });

}


exports.deleteMessageFromQueue = function( queue, sqsMessage ) {
  
  var receiptHandle = sqsConnect.getSQSMessageAttribute(sqsMessage, 'ReceiptHandle');

  if ( ! receiptHandle ) {
    winston.error('deleteMessageFromQueue: missing receipt handle, sqsMessage: ', sqsMessage );
    return;
  }

  var outbound = {
    ReceiptHandle: receiptHandle
  };
  //winston.info('deleting message from queue...', receiptHandle);
  queue.call( "DeleteMessage", outbound, function (err) {
    if ( err ) {
      winston.error('deleteMessageFromQueue: got error from DeleteMessage: ', err);
    } else {
      var message = sqsConnect.getSQSMessageAttribute(sqsMessage, 'Body');
      winston.info("deleted message from queue: ", message);
    }
  });
}

exports.addMessageToMailReaderQueue = function (message) {
  this.addMessageToQueue(mailReaderQueue, message);
}

exports.pollMailReaderQueue = function( handleMessage ) {
  this.pollQueue( mailReaderQueue, handleMessage, 1);
}

exports.pollMailDownloadQueue = function( handleMessage, maxObjects ) {
  this.pollQueue( mailDownloadQueue, handleMessage, maxObjects );
}