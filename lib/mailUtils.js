var winston = require ('./winstonWrapper').winston
  , conf = require('../conf')
  , constants = require ('../constants')
  , cloudStorageUtils = require ('./cloudStorageUtils')
  , mimelib = require ('mimelib')
  , convertUtils = require ('./convertUtils')
  , mongoose = require ('mongoose')
  , MailModel = require('../schema/mail').MailModel

var mailUtils = this;

exports.getHexValue = function( decimal ) {
  return convertUtils.decimalToHex( decimal );
}

exports.getDecimalValue = function( hex ) {
  return convertUtils.hexToDecimal( hex );
}

exports.subjectStartsWithAPrefix = function(subject, prefixes) {

  if ( ! subject ) {
    return false;
  }

  for ( var i=0; i<prefixes.length; i++ ) {
    var prefix = prefixes[i].toLowerCase();
    if ( subject.toLowerCase().substring(0, prefix.length) == prefix ) {
      return true;
    }
  }
  return false;
}

exports.getDirtySubject = function(rawSubject) {
  var dirtySubject = rawSubject;
  if ( ! dirtySubject ) {
    dirtySubject = '';
  }
  return dirtySubject;
}

exports.getCleanSubject = function(rawSubject) {
  var subject = rawSubject;
  if ( ! subject ) {
    subject = '';
  }
  var prefixes = ['Re:', 'Fwd:', ' ', 'Aw:'];  //Apparently 'Aw:' is German for 'Re:'
  while ( mailUtils.subjectStartsWithAPrefix(subject, prefixes ) ) {
    for ( var i=0; i<prefixes.length; i++ ) {
      var prefix = prefixes[i].toLowerCase();
      if ( subject.toLowerCase().substring(0, prefix.length) == prefix ) {
        subject = subject.substring(prefix.length).trim();
        continue;
      }
    }
  }
  if ( subject ) {
    subject = subject.trim();
  }
  return subject;
}

exports.getRecipients = function(list) {
  var recipients = [];
  if ( list ) {
    for ( var i=0; i<list.length; i++ ) {
      var recipientAddressAndName = list[i];
      var recipient = {
          name: recipientAddressAndName.name
        , email: recipientAddressAndName.address
      }
      recipients.push( recipient );
    }
  }
  return recipients;
}

exports.cleanAddresses = function(dirtyList) {
  //toString, trim, de-dupe
  var result = [];
  for ( var i=0; i<dirtyList.length; i++) {
    var dirty = dirtyList[i];
    var clean = dirty.toString().trim();
    if ( result.indexOf(clean) == -1 ) {
      result.push(clean);
    }
  }
  return result;
}

exports.extractEmailUser = function(address) {
  if ( ! address ) {
    return null;
  }
  var emailUser = address;
  var atIndex = emailUser.lastIndexOf('@');
  if ( atIndex !== -1 ) {
    emailUser = emailUser.substring(0, atIndex);
  }
  var openCarrotIndex = emailUser.lastIndexOf('<');
  if ( openCarrotIndex !== -1 ) {
    emailUser = emailUser.substring(openCarrotIndex + 1);
  }
  emailUser = emailUser.trim();
  return emailUser;
}

exports.renameAddressField = function (arr) {
  arr.forEach (function (rec) {
    rec['email'] = rec['address'];
    delete rec[ 'address' ];
  });
}

exports.getAllRecipients = function(hdrs) {
  var toRecipients = [];
  var ccRecipients = [];
  var bccRecipients = [];

  if ( hdrs.to && ( hdrs.to.length > 0 ) ) {
    toRecipients = mimelib.parseAddresses(hdrs.to[0]);
    mailUtils.renameAddressField (toRecipients);
  }
  if ( hdrs.cc && ( hdrs.cc.length > 0 ) ) {
    ccRecipients = mimelib.parseAddresses(hdrs.cc[0]);
    mailUtils.renameAddressField (ccRecipients);
  }
  if ( hdrs.bcc && ( hdrs.bcc.length > 0 ) ) {
    bccRecipients = mimelib.parseAddresses(hdrs.bcc[0]);
    mailUtils.renameAddressField (bccRecipients);
  }

  var allRecipients = toRecipients.concat(ccRecipients).concat(bccRecipients);
  return allRecipients;
}

exports.getNumAttachments = function(parsedMail) {
  var numAttachments = 0;
  if ( parsedMail.attachments ) {
    numAttachments = parsedMail.attachments.length;
  }
  return numAttachments;
}

exports.getSentDate = function(parsedMail) {
  var sentDate = null;
  if ( parsedMail.headers['date'] ) {
    sentDate = new Date( Date.parse( parsedMail.headers['date'] ) );
  }
  return sentDate;
}

exports.getSender = function(hdrs) {
  if ( hdrs.from && ( hdrs.from.length > 0 ) ) {
    var mimelibSender = mimelib.parseAddresses(hdrs.from[0]);
    mailUtils.renameAddressField (mimelibSender);
    if (mimelibSender && mimelibSender.length) {
      return mimelibSender[0];
    }
  }

  return { name: '', email: ''};
}

//Annoying mongoose hack.  Apparently mongoose isn't happy using mail.sender directly as the sender.
exports.copySender = function(sourceSender) {
  var sender = {
      name: ''
    , email: ''
  }
  if ( sourceSender ) {
    sender.name = sourceSender.name;
    sender.email = sourceSender.email;
  }
  return sender;
}


exports.isValidEmail = function (str) {

  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return re.test(str);
}

exports.getMessageId = function(parsedMail) {
  var messageId = null;
  if ( parsedMail.headers['message-id'] ) {
    messageId = parsedMail.headers['message-id'];
  }
  return messageId;
}

exports.getBodyText = function(parsedMail) {
  var result = '';
  if ( parsedMail && parsedMail.text ) {
    result = parsedMail.text;
  }
  return result;
}

exports.getBodyHTML = function(parsedMail) {
  var result = '';
  if ( parsedMail && parsedMail.html ) {
    result = parsedMail.html;
  }
  return result;
}



exports.saveMailBody = function( mail, uploadAll, callback ) {
  //winston.doInfo ('saveMailBody', {mailId : mail._id, uploadAll : uploadAll});

  if ( ! mail ) { callback( winston.makeMissingParamError('mail') ); return; }

  if ( mail.indexable || uploadAll ) {
    var mailBody = {
        bodyText: mail.bodyText
      , bodyHTML: mail.bodyHTML
    }

    var buffer = JSON.stringify(mailBody);
    var cloudPath = cloudStorageUtils.getMailBodyPath( mail );
    var options = {};
    var useGzip = true;
    var useAzure = false;

    cloudStorageUtils.putBuffer( buffer, cloudPath, options, useGzip, useAzure, function (err) {
      if (err) {
        callback (err);
        
        var query = {_id : mail._id};
        MailModel.update (query, {$set : {bodyInS3 : false}}, function (mongoErr, num) {
          if (mongoErr) { 
            winston.doMongoError(mongoErr, {msg: 'could not update model bodyInS3'});
          }
          else if (num == 0) {
            winston.doWarn ('Zero records affected when marking bodyInS3', {query : query, model : 'mail'});
          }
        });
      }
      else {
        var query = {_id : mail._id};

        MailModel.update (query, {$set : {bodyInS3 : true}}, function (mongoErr, num) {
          if (mongoErr) { 
            winston.doMongoError(mongoErr, {msg: 'could not update model bodyInS3'});
            callback (winston.makeMongoError (mongoErr));
          }
          else if (num == 0) {
            winston.doWarn ('Zero records affected when marking bodyInS3', {query : query, model : 'mail'});
            callback (winston.makeError ('no records affected when saving bodyInS3 state for mail'));
          }
          else {
            callback ();
          }
        });
      }

    });

  } else {
    callback();
  }
}

exports.downloadMailAndRunParser = function( cloudStoragePath, mailParser, inAzure, callback ) {
  mailUtils.downloadMailAndRunParserAttempt( cloudStoragePath, mailParser, inAzure, constants.CLOUD_STORAGE_RETRIES, callback );
}

exports.downloadMailAndRunParserAttempt = function( cloudStoragePath, mailParser, inAzure, numRemainingAttempts, callback ) {

  numRemainingAttempts--;
  var startTime = Date.now();
  winston.doInfo('About to getFile', {cloudStoragePath: cloudStoragePath});
  var dataSize = 0;
  var calledBack = false;
  var hasWrittenData = false;

  cloudStorageUtils.getFile( cloudStoragePath, false, inAzure, function(err, res, resEnded) {
    var errorData = {
        cloudStoragePath : cloudStoragePath
      , inAzure: inAzure
    };
    if ( res ) {
      errorData['statusCode'] = res.statusCode;
    }

    if ( err ) {
      callback( err );

    } else if ( ! res ) {
      callback( winston.makeError('no response', errorData) );

    } else {

      res.on('data', function(data) {
        // data - but data could be something like...
        dataSize += data.length;
        mailParser.write(data);
        hasWrittenData = true;
      });

      // if we aren't using azure for raw email
      // the normal end event is fine to use
      if (!inAzure) {
        res.on ('end', fileUploadFinished);
      } else {
        res.on('finished', fileUploadFinished);
      }

      res.on('error', function (err) {
        winston.doInfo('getFile error', {cloudStoragePath: cloudStoragePath});
        if ( calledBack ) {
          winston.doError('BAD! In "res.error", but we already called back', {cloudStoragePath: cloudStoragePath});
        } else {
          calledBack = true;
          if ( hasWrittenData || ( numRemainingAttempts <= 0 ) ) {
            callback( winston.makeError('Error downloading email from cloud', {err : err}) );
          } else {
            winston.doWarn('Failed, but will retry to download mail', {cloudStoragePath: cloudStoragePath, numRemainingAttempts: numRemainingAttempts, inAzure: inAzure});
            mailUtils.downloadMailAndRunParserAttempt( cloudStoragePath, mailParser, inAzure, numRemainingAttempts, callback );
          }
        }
      });

      function fileUploadFinished () {
        var elapsedTime = Date.now() - startTime;
        var metric = 'bad';
        if ( elapsedTime ) {
          metric = dataSize / elapsedTime;
        }

        winston.doInfo('completed getFile', {cloudStoragePath: cloudStoragePath, dataSize: dataSize, elapsedTime: elapsedTime, metric: metric, calledBack : calledBack});

        if ( calledBack ) {
          winston.doError('BAD! In "res.end", but we already called back', {cloudStoragePath: cloudStoragePath});
        } else {
          calledBack = true;
          mailParser.end();
        }
      }

    }
  });
}
