var utils = require('./utils')
  , winston = require('./winstonWrapper').winston
  , constants = require ('../constants')
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

      // for premium users there's no minDate on the task
      if (user.isPremium) {
        resume.isPremium = true;
        resume.maxDate = user.lastResumeJobEndDate;
      } else {
        // the new job is only responsible for this interval of time
        resume.minDate = new Date (Date.now() - user.daysLimit*constants.ONE_DAY_IN_MS)
        resume.maxDate = user.lastResumeJobEndDate;
      }

      if (!user.isPremium && resume.maxDate.getTime() < resume.minDate.getTime()) {
        callback ();
      } else {
        resume.save( function( err ) {
          if ( err ) {
            callback( winston.makeMongoError( err ) );
          } else {
            user.lastResumeJobEndDate = resume.minDate;
            user.save (function (err) {
              if (err) {
                callback( winston.makeMongoError( err ) );
              } else {
                winston.doInfo ('user saved', {user : user});
                callback();
              }
            });
          }
        });
      }

    }
  });
}