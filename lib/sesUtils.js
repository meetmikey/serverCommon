var aws = require('aws-lib'),
    emailTemplates = require ('./emailTemplates'),
    _ = require ('underscore'),
    winston = require ('./winstonWrapper').winston,
    conf = require ('../conf');

var sesUtils = this;

var sesClient = aws.createSESClient(conf.aws.key, conf.aws.secret);

exports.sendEmail = function (recipients, sender, replyTo, text, html, subject, callback) {
  var sendArgs = {
    'Message.Body.Text.Charset': 'UTF-8',
    'Message.Body.Text.Data': text,
    'Message.Subject.Charset': 'UTF-8',
    'Message.Subject.Data': subject,
    'Source': sender
  };

  var n=1;
  recipients.forEach (function (rec) {
    sendArgs['Destination.ToAddresses.member.' + n] = rec;
    n+=1;
  });

  if (replyTo) {
    sendArgs['ReplyToAddresses.member.1'] = replyTo;
  }

  if (html) {
    sendArgs['Message.Body.Html.Data'] = html;
    sendArgs['Message.Body.Html.Charset'] = 'UTF-8';
  }

  sesClient.call('SendEmail', sendArgs, function(err, result) {
    if (err) {
      callback (winston.makeError (err));
    } else {
      callback ();
    }
  });

}


exports.sendAllMailDoesntExistNotification = function (isOnboarding, userEmail, callback) {
  if (isOnboarding) {
    sesUtils.sendEmail ([userEmail], 'Mikey Support <support@mikeyteam.com>', null, emailTemplates.getAllMailTextEmail(isOnboarding), 
      null, 'Mikey needs your help to process your account!', callback);
  } else {
    sesUtils.sendEmail ([userEmail], 'Mikey Support <support@mikeyteam.com>', null, emailTemplates.getAllMailTextEmail(isOnboarding), 
      null, 'Mikey encountered an error accessing your account!', callback);
  }
}

exports.sendInternalNotificationEmail = function (text, subject, callback) {
  sesUtils.sendEmail (['it@mikeyteam.com'],  'noreply@mikeyteam.com', null, text, text, subject, callback);
}


// type can be 'link', 'file', or 'image'
exports.sendLikeEmail = function (isLink, model, user, callback) {
  var recipients = _.map (model.recipients, function (rec) { return rec.email });
  var replyTo = user.email;
  var senderName = user.firstName;

  var type = 'link';
  if (!isLink) {
    if (model.isImage) {
      type = 'image';
    } else {
      type = 'attachment';
    }
  }

  emailTemplates.getLikeTextAndHTML (model, type, senderName, function (err, emailText, emailHTML) {
    sesUtils.sendEmail (recipients, senderName + '<noreply@mikeyteam.com>', replyTo, emailText, 
      emailHTML, senderName + ' liked the ' + type, callback);
  });

}