var winston = require ('./winstonWrapper').winston
  , conf = require('../conf')

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
  if ( name.indexOf('@') !== -1 ) {
    winston.warn('mailUtils: extractName: name still contains @ symbol');
  }
  return name;
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
  while ( this.subjectStartsWithAPrefix(subject, prefixes ) ) {
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
  var allRecipients = toRecipients.concat(ccRecipients);
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
}

exports.splitNameAndAddress = function (addressesString) {
  var arr = []
  var addressPairs = getEmailStrings (addressesString)

  addressPairs.forEach (function (pair) {
    arr.push ({name : mailUtils.extractName(pair), address : mailUtils.extractEmailAddress(pair)})
  })

  return arr
}


getEmailStrings = function(input) {
  var result = [];
  if( Array.isArray (input) ) {
    for ( var i=0; i<input.length; i++ ) {
      var emailAddress = input[i].toString().trim();
      if ( emailAddress !== '' ) {
        result.push( emailAddress );
      }
    }
  } else {
    var tempSplit = input.split(",");
    for ( var i=0; i<tempSplit.length; i++ ) {
      var splitPiece = tempSplit[i];
      
      var tempSplit2 = splitPiece.split(";");
      for ( var j=0; j<tempSplit2.length; j++ ) {
        var emailAddress = tempSplit2[j].trim();
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

exports.isImage = function(attachment) {
  if ( attachment && attachment.contentType ) {
    var contentType = attachment.contentType;
    if ( contentType.indexOf('image/') === 0 ) {
      return true;
    }
  }
  return false;
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