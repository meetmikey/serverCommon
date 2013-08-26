var serverCommon = process.env.SERVER_COMMON;

var swig = require ('swig')
  , urlUtils = require('./urlUtils')
  , utils = require('./utils')
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
exports.getLikeTextAndHTML = function( user, model, type, callback ) {

  if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
  if ( ! model ) { callback( winston.makeMissingParamError('model') ); return; }
  if ( ! type ) { callback( winston.makeMissingParamError('type') ); return; }

  var template = swig.compileFile(serverCommon + '/email_templates/like.swig');
  var senderName = user.firstName;
  if ( ! senderName ) {
    senderName = user.email;
  }
  var referralLink = constants.BASE_REFERRAL_URL + '/' + user.shortId + '/' + constants.REFERRAL_SOURCE_LIKE;

  var templateData = {
      senderName: senderName
    , type: type
    , referralLink: referralLink
    , mixpanelPixelURL: emailTemplates.getLikeEmailMixpanelPixelURL( 'openLikeEmail', user, model, type )
  }

  if ( type === 'link' ) {
    templateData['isLink'] = true;
    templateData['title'] = model.title;
    templateData['url'] = model.url;
    templateData['summary'] = model.summary;
    templateData['linkImage'] = emailTemplates.getFaviconURL( model.url );

  } else {
    templateData['filename'] = model.filename;
    templateData['docType'] = model.docType;
    templateData['fileSize'] = model.fileSize;
    templateData['fileIcon'] = emailTemplates.getFileIconURL( model.docType );
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


exports.getLikeEmailMixpanelPixelURL = function( user, model, resourceType ) {

  var eventType = 'openLikeEmail';
  var senderUserId = '';
  var senderName = '';
  if ( user ) {
    senderUserId = user._id;
    senderName = utils.getFullNameFromUser( user );
  } else {
    winston.doWarn('getMixpanelPixelURL, no user!');
  }

  var resourceId = '';
  if ( model ) {
    resourceId = model._id;
  } else {
    winston.doWarn('getMixpanelPixelURL, no model!');
  }

  var eventData = {
      'senderUserId': senderUserId
    , 'senderName': senderName
    , 'resourceId': resourceId
    , 'resourceType': resourceType
  }
  
  var url = utils.getMixpanelPixelURL( eventType, eventData );
  return url;
}

exports.getFileIconURL = function( fileType ) {

  var baseURL = constants.CLOUD_FRONT_BASE_URL;
  var fileIconURL = baseURL;
  switch ( fileType ) {
    case 'pdf':
      fileIconURL += 'img/pdf.png';
      break;
    case 'spreadsheet':
      fileIconURL += 'img/excel.png';
      break;
    case 'document':
      fileIconURL += 'img/word.png';
      break;
    case 'presentation':
      fileIconURL += 'img/ppt.png';
      break;
    case 'code':
      fileIconURL += 'img/code.png';
      break;
    case 'image':
      fileIconURL += 'img/image.png';
      break;
    case 'music':
      fileIconURL += 'img/music.png';
      break;
    case 'video':
      fileIconURL += 'img/video.png';
      break;
    case 'archive':
      fileIconURL += 'img/zip.png';
      break;
    case 'other':
    default:
      fileIconURL += 'img/unknown.png';
      break;
  }
  return fileIconURL;
}

exports.getFaviconURL = function( url ) {
  if ( ! url ) {
    return '';
  }
  var faviconBaseURL = constants.FAVICON_BASE_URL;
  var hostname = urlUtils.getHostname( url, true );
  var faviconURL = faviconBaseURL + hostname;
  return faviconURL;
}