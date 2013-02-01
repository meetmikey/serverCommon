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
  email = email.trim();
  return email;
}

exports.subjectStartsWithAPrefix = function(subject, prefixes) {
  for ( var i=0; i<prefixes.length; i++ ) {
    var prefix = prefixes[i].toLowerCase();
    if ( subject.toLowerCase().substring(0, prefix.length) == prefix ) {
      return true;
    }
  }
  return false;
}

exports.getCleanSubject = function(subject) {
  var prefixes = ['Re: ', 'Fwd: ', ' '];
  while ( this.subjectStartsWithAPrefix(subject, prefixes ) ) {
    for ( var i=0; i<prefixes.length; i++ ) {
      var prefix = prefixes[i].toLowerCase();
      if ( subject.toLowerCase().substring(0, prefix.length) == prefix ) {
        subject = subject.substring(prefix.length).trim();
        continue;
      }
    }
  }
  return subject.trim();
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

exports.getAllRecipients = function(mail) {
  var toRecipients = mailUtils.getRecipients(mail.to);
  var ccRecipients = mailUtils.getRecipients(mail.cc);
  var allRecipients = toRecipients.concat(ccRecipients);
  return allRecipients;
}

exports.getNumAttachments = function(mail) {
  var numAttachments = 0;
  if ( mail.attachments ) {
    numAttachments = mail.attachments.length;
  }
  return numAttachments;
}

exports.getSentDate = function(mail) {
  var sentDate = null;
  if ( mail.headers['date'] ) {
    sentDate = new Date( Date.parse( mail.headers['date'] ) );
  }
  return sentDate;
}

exports.getSender = function(mail) {
  var sender = { name: '', email: ''};
  if ( mail.from && ( mail.from.length > 0 ) ) {
    var fromAddressAndName = mail.from[0];
    sender.name = fromAddressAndName.name;
    sender.email = fromAddressAndName.address;
  }
  return sender;
}

exports.getMessageId = function(mail) {
  var messageId = null;
  if ( mail.headers['message-id'] ) {
    messageId = mail.headers['message-id'];
  }
  return messageId;
}

exports.getAttachmentImage = function(attachment) {
  var image = null;
  if ( attachment && attachment.contentType ) {
    var contentType = attachment.contentType;
    if ( contentType.indexOf('image/') === 0 ) {
      image = '';
    }
  }
  return image;
}