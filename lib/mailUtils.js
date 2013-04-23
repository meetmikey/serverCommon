var winston = require ('./winstonWrapper').winston
  , conf = require('../conf')
  , constants = require ('../constants')
  , cloudStorageUtils = require ('./cloudStorageUtils')
  , mongoose = require ('mongoose')
  , bigdecimal = require ('bigdecimal')
  , MailModel = require('../schema/mail').MailModel

var mailUtils = this;

exports.extractName = function(nameAndAddress) {
  var name = nameAndAddress;
  if ( ! name ) {
    return name;
  }
  var openCarrotIndex = name.indexOf('<');
  if ( openCarrotIndex != -1 ) {
    name = name.substring(0, openCarrotIndex);
  }
  name = name.trim();
  
  return name;
}

exports.getHexValue = function (decimal) {
  return decimal ? new bigdecimal.BigInteger(decimal).toString(16) : '';
}

exports.extractEmailAddress = function(nameAndAddress) {
  var email = nameAndAddress;
  if ( ! email ) {
    return email;
  }
  var openCarrotIndex = email.indexOf('<');
  if ( openCarrotIndex != -1 ) {
    email = email.substring(openCarrotIndex + 1);
  }
  var closeCarrotIndex = email.indexOf('>');
  if ( closeCarrotIndex != -1 ) {
    email = email.substring(0, closeCarrotIndex);
  }
  email = email.trim().toLowerCase();
  return email;
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

exports.getAllRecipients = function(parsedMail) {
  var toRecipients = mailUtils.getRecipients(parsedMail.to);
  var ccRecipients = mailUtils.getRecipients(parsedMail.cc);
  var bccRecipients = mailUtils.getRecipients(parsedMail.bcc)
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

exports.getSender = function(parsedMail) {
  var sender = { name: '', email: ''};
  if ( parsedMail.from && ( parsedMail.from.length > 0 ) ) {
    var fromAddressAndName = parsedMail.from[0];
    sender.name = fromAddressAndName.name;
    sender.email = fromAddressAndName.address;
  }
  return sender;
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

exports.normalizeAddressArrays = function (hdrs) {
  if ( hdrs.from && ( hdrs.from.length > 0 ) ) {
    hdrs.from = mailUtils.splitNameAndAddress (hdrs.from[0])
  }
  if ( hdrs.to && ( hdrs.to.length > 0 ) ) {
    hdrs.to = mailUtils.splitNameAndAddress (hdrs.to[0])
  }
  if ( hdrs.cc && ( hdrs.cc.length > 0 ) ) {
    hdrs.cc = mailUtils.splitNameAndAddress (hdrs.cc[0])
  }
  if ( hdrs.bcc && ( hdrs.bcc.length > 0 ) ) {
    hdrs.bcc = mailUtils.splitNameAndAddress (hdrs.bcc[0])
  }
}

exports.splitNameAndAddress = function (addressesString) {
  var arr = []
  var addressPairs = mailUtils.getEmailStrings(addressesString)
  addressPairs.forEach (function (pair) {
    arr.push ({name : mailUtils.extractName(pair), address : mailUtils.extractEmailAddress(pair)})
  })

  return arr
}

exports.getEmailStrings = function(input) {
  var result = [];
  if( Array.isArray (input) ) {
    for ( var i=0; i<input.length; i++ ) {
      var emailAddress = input[i].toString().trim();
      if ( emailAddress !== '' ) {
        result.push( emailAddress );
      }
    }
  } else {
    var tempSplit = input.split(/,\s*\"/);
    for ( var i=0; i<tempSplit.length; i++ ) {
      var splitPiece = tempSplit[i].replace (/\"/g, "");
      
      // check if we still have multiple @ symbols in which case
      // our initial regex didn't split - so just split on
      // commas...
      var ats = splitPiece.match (/@/g);
      if (ats && ats.length > 1) {
        var tempSplit2 = splitPiece.split (",");
        tempSplit2.forEach (function (address){
          var emailAddress = address.trim();
          if ( emailAddress !== '' ) {
            result.push( emailAddress );
          }
        })
      }
      else {
        var emailAddress = splitPiece.trim();
        if ( emailAddress !== '' ) {
          result.push( emailAddress );
        }
      }

    }
  }
  return result;
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
  winston.doInfo ('saveMailBody', {mailId : mail._id, uploadAll : uploadAll});

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

  var startTime = Date.now();
  winston.doInfo('About to getFile', {cloudStoragePath: cloudStoragePath});
  var dataSize = 0;
  var calledBack = false;

  cloudStorageUtils.getFile( cloudStoragePath, false, inAzure, function(err, res) {
    if ( err ) {
      callback( err );
      
    } else if ( ! res) {
      callback( winston.makeMissingParamError('res') );

    } else if (!inAzure && res && res.statusCode != 200) {
      callback (winston.makeS3Error ('Non-200 status code for download and run mail parser'), {statusCode : res.statusCode, cloudStoragePath : cloudStoragePath});
      cloudStorageUtils.printResponse (res, inAzure);

    } else if (inAzure && res && res.properties && !res.properties.blobType) {
      callback (winston.makeAzureError ('Block blob for mail object must not exist', {cloudStoragePath : cloudStoragePath}));
      cloudStorageUtils.printResponse (res, inAzure);

    } else {

      res.on('data', function(data) {
        // data - but data could be something like...
        dataSize += data.length;
        mailParser.write(data);
      });
      res.on('end', function() {

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
      });
      res.on('error', function (err) {
        winston.doInfo('getFile error', {cloudStoragePath: cloudStoragePath});
        if ( calledBack ) {
          winston.doError('BAD! In "res.error", but we already called back', {cloudStoragePath: cloudStoragePath});
        } else {
          calledBack = true;
          callback( winston.makeError('Error downloading email from cloud', {err : err}) );
        }
      });
    }
  });
}