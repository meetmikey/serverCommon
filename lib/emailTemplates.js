var serverCommon = process.env.SERVER_COMMON;

var swig = require ('swig')
    , winston = require('./winstonWrapper').winston
    , constants = require ('../constants')
    , LinkModel = require (serverCommon + '/schema/link').LinkModel
    , AttachmentModel = require (serverCommon + '/schema/attachment').AttachmentModel

var emailTemplates = this;

exports.getAllMailTextEmail = function (isOnboarding) {
  if (isOnboarding) {  	

  	return "Hi there,\n\n\
Thanks for signing up for Mikey for gmail!\n\n\
Currently, Mikey uses the \"All Mail\" folder to process your account and we'll need you to allow access to this folder.\n\n\
That may sound confusing, but it's only three easy steps:\n\n\
1) Click the gear icon on the top right corner of your gmail.\n\
2) Click the \"Labels\" heading.\n\
3) Under \"System Labels\" find the row for \"All Mail\" and click the check box \"Show in IMAP\"\n\n\
Sorry for the inconvenience and let us know if you have any issues.\n\n\
Best,\n\
Team Mikey"

  } else {

	return "Hi there,\n\n\
There was an error keeping Mikey up to date with your gmail account.\n\n\
Currently, Mikey uses the \"All Mail\" folder to process your account and we'll need you to allow access to this folder.\n\n\
That may sound confusing, but it's only three easy steps:\n\
1) Click the gear icon on the top right corner of your gmail.\n\
2) Click the \"Labels\" heading.\n\
3) Under \"System Labels\" find the row for \"All Mail\" and click the check box \"Show in IMAP\"\n\n\
Sorry for the inconvenience and let us know if you have any issues. If you'd like to disable Mikey please refer to the FAQ on our website.\n\n\
Best,\n\
Team Mikey"

  }
}


exports.getAllMailHTMLEmail = function (isOnboarding) {
	return emailTemplates.getAllMailTextEmail(isOnboarding);
}


// function (err, emailText, emailHTML)
exports.getLikeTextAndHTML = function( model, type, senderName, callback ) {

  var template = swig.compileFile(serverCommon + '/email_templates/like.swig');

  var templateData = {
      senderName: senderName
    , type: type
  }

  if ( type === 'link' ) {
    templateData['isLink'] = true;
    templateData['title'] = model.title;
    templateData['url'] = model.url;
    templateData['summary'] = model.summary;

  } else {
    templateData['filename'] = model.filename;
    templateData['docType'] = model.docType;
    templateData['fileSize'] = model.fileSize;
    if ( type === 'image' ) {
      templateData['isImage'] = true;
    } else {
      templateData['isAttachment'] = true;
    }
  }

  var output = template.render( templateData );
  //TODO: create text version
  callback( null, output, output );
}