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
    console.warn('Warning: mailUtils: extractName: name still contains @ symbol');
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

exports.getRecipients = function(toList, ccList) {
  var receipients = [];
  if ( toList ) {
    for ( var i=0; i<toList.length; i++ ) {
      var recipientAddressAndName = toList[i];
      var recipient = {
          name: mailUtils.extractName(recipientAddressAndName)
        , email: mailUtils.extractEmailAddress(recipientAddressAndName)
      }
      recipients.push( recipient );
    }
  }
  //Repeating this sucks, but I don't trust some array ops...
  if ( ccList ) {
    for ( var i=0; i<ccList.length; i++ ) {
      var recipientAddressAndName = ccList[i];
      var recipient = {
          name: mailUtils.extractName(recipientAddressAndName)
        , email: mailUtils.extractEmailAddress(recipientAddressAndName)
      }
      recipients.push( recipient );
    }
  }
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