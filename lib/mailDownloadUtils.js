var utils = require('./utils')
  , winston = require('./winstonWrapper').winston
  , ResumeDownloadStateModel = require ('../schema/onboard').ResumeDownloadStateModel
  , MailBoxModel = require ('../schema/mail').MailBoxModel

var mailDownloadUtils = this;

exports.createResumeDownloadNow = function( user, callback ) {

  if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }

  var userId = user._id;
  MailBoxModel.findOne ({userId : userId}, function( mongoErr, foundMailbox ) {
    if ( mongoErr ) {
      callback( winston.makeMongoError( mongoErr ) );

    } else if ( ! foundMailbox ) {
      callback( winston.makeError('No mailbox found', {userId: userId}) );

    } else {
      var resume = new ResumeDownloadStateModel({
        userId : userId,
        mailBoxId : foundMailbox._id,
        maxUid : foundMailbox.uidNext -1,
        resumeAt : Date.now()
      });

      resume.save( function( mongoErr ) {
        if ( mongoErr ) {
          callback( winston.makeMongoError( mongoErr ) );

        } else {
          callback();
        }
      });
    }
  });
}