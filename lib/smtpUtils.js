var serverCommon = process.env.SERVER_COMMON;

var aws = require('aws-lib'),
    emailTemplates = require ('./emailTemplates'),
    _ = require ('underscore'),
    nodemailer = require ('nodemailer'),
    async = require ('async'),
    fs = require ('fs'),
    winston = require ('./winstonWrapper').winston,
    utils = require ('./utils'),
    MailModel = require (serverCommon + '/schema/mail').MailModel,
    conf = require ('../conf');

var smtpUtils = this;

// type can be 'link', 'file', or 'image'
exports.sendLikeEmail = function (isLink, model, user, callback) {
  // everybody on the thread
  var participants = _.map (model.recipients, function (par) { return par.email }).concat ([model.sender.email]);

  // filter out the person who is about to take the action
  var recipients = _.filter (participants, function (parEmail) {
    return parEmail != user.email;
  });
  
  var sender = user.email;
  var fullName = utils.getFullNameFromUser( user );
  if ( fullName ) {
    sender = fullName + ' <' + user.email + '>';
  }

  var type = 'link';
  if (!isLink) {
    if (model.isImage) {
      type = 'image';
    } else {
      type = 'attachment';
    }
  }


  async.waterfall([
    // get the mail model msgId
    function(cb){
      MailModel.findById (model.mailId, function (err, foundMail) {
        if (err) {
          cb (winston.makeMongoError (err));
        } else if (!foundMail) {
          cb (winston.makeError ('Could not find mail model with id', {_id : model.mailId}));
        } else {
          cb (null, foundMail.messageId);
        }
      });
    },
    // fill in the email template
    function(messageId, cb){
      emailTemplates.getLikeTextAndHTML( user, model, type, function (err, emailText, emailHTML) {
        if (err) {
          cb (err);
        } else {
          cb (null, messageId, emailText, emailHTML);
        }
      });
    },
    function (messageId, emailText, emailHTML, cb) {
      if(recipients.length == 0) {
        winston.doWarn ('Nobody to send email to');
        cb();
      } else {
        smtpUtils.sendEmail (user, messageId, recipients, sender, emailText, emailHTML, model.mailCleanSubject, cb);
      }
    }
  ], function (err) {
    callback (err);
  });
}


exports.sendEmail = function (user, messageId, recipients, sender, text, html, subject, callback) {

  // create reusable transport method (opens pool of SMTP connections)
  var smtpTransport = nodemailer.createTransport("SMTP", {
      service: "Gmail",
      secureConnection : true,
      auth:{
        XOAuth2: {
            user: user.email,
            clientId: conf.google.appId,
            clientSecret: conf.google.appSecret,
            refreshToken: user.refreshToken,
            accessToken: user.accessToken,
            timeout: 3600
        }
      }
  });

  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: sender,
      to: recipients.join (","),
      subject: 'RE: ' + subject,
      inReplyTo : messageId,
      text: text,
      html: html
  }

  // send mail with defined transport object
  smtpTransport.sendMail(mailOptions, function(err, response){
    if(err){
      callback (winston.makeError ('could not send mail', {err : err}));
    }else{
      callback ();      
    }

    // if you don't want to use this transport object anymore, uncomment following line
    smtpTransport.close(); // shut down the connection pool, no more messages
  });
}