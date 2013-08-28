var serverCommon = process.env.SERVER_COMMON;

var swig = require ('swig')
  , urlUtils = require('./urlUtils')
  , utils = require('./utils')
  , winston = require('./winstonWrapper').winston
  , constants = require('../constants')
  , linkUtils = require(serverCommon + '/lib/linkUtils')
  , attachmentUtils = require(serverCommon + '/lib/attachmentUtils')
  , cloudStorageUtils = require(serverCommon + '/lib/cloudStorageUtils')
  , LinkModel = require(serverCommon + '/schema/link').LinkModel
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


// function (err, emailText, emailHTML, emailAttachments)
exports.getLikeEmail = function( user, model, resourceType, isPreview, callback ) {

  if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
  if ( ! model ) { callback( winston.makeMissingParamError('model') ); return; }
  if ( ! resourceType ) { callback( winston.makeMissingParamError('resourceType') ); return; }

  var template = swig.compileFile(serverCommon + '/email_templates/like.swig');
  var senderName = user.firstName;
  if ( ! senderName ) {
    senderName = user.email;
  }
  var referralLink = constants.BASE_REFERRAL_URL + '/' + user.shortId + '/' + constants.REFERRAL_SOURCE_LIKE;
  var mixpanelPixelURL = emailTemplates.getLikeEmailMixpanelPixelURL( user, model, resourceType );
  if ( isPreview ) {
    mixpanelPixelURL = '';
  }

  var senderImage = user.picture;
  if ( ! senderImage ) {
    senderImage = constants.CLOUD_FRONT_BASE_URL + 'img/avatar.png';
  }

  var originalSenderName = null;
  if ( model.sender.name ) {
    originalSenderName = model.sender.name;
    if ( originalSenderName.indexOf(' ') !== -1 ) {
      originalSenderName = originalSenderName.substring( 0, originalSenderName.indexOf(' ') );
    }
  } else if ( model.sender.email ) {
    originalSenderName = model.sender.email;
  }

  var resourceTypeBeginsWithAVowel = true;
  if ( resourceType === 'link' ) {
    resourceTypeBeginsWithAVowel = false;
  }

  var basicTemplateData = {
      senderName: senderName
    , resourceType: resourceType
    , resourceTypeBeginsWithAVowel: resourceTypeBeginsWithAVowel
    , referralLink: referralLink
    , mixpanelPixelURL: mixpanelPixelURL
    , senderImage: senderImage
    , originalSenderName: originalSenderName
  }

  var templateDataMethod = emailTemplates.getAttachmentTemplateData
  if ( resourceType === 'link' ) {
    templateDataMethod = emailTemplates.getLinkTemplateData
  }
  templateDataMethod( user, model, resourceType, isPreview, function(err, modelTemplateData, emailAttachments) {
    if ( err ) {
      callback( err );

    } else {
      var fullTemplateData = utils.mergeObjects( basicTemplateData, modelTemplateData );
      var html = template.render( fullTemplateData );
      //TODO: create text version
      callback( null, html, html, emailAttachments );
    }
  });
}

//callback should return err, modelTemplateData, emailAttachments
exports.getLinkTemplateData = function( user, link, resourceType, isPreview, callback ) {
  var templateData = {};
  var emailAttachments = [];
  
  var linkTitle = link.title;
  if ( ! linkTitle ) {
    linkTitle =  link.get('url');
  }
  templateData['isLink'] = true;
  templateData['title'] = linkTitle;
  templateData['url'] = link.url;
  templateData['summary'] = link.summary;
  templateData['linkFavicon'] = emailTemplates.getFaviconURL( link.url );

  if ( ! link.image ) {
    callback( null, templateData, emailAttachments );

  } else if ( isPreview ) {
    templateData['linkImage'] = linkUtils.getSignedImageURL( link );
    callback( null, templateData, emailAttachments );
    
  } else {
    var attachmentName = 'attachment1';
    templateData['linkImage'] = 'cid:' + attachmentName;
    var imageCloudPath = linkUtils.getImageCloudPath( link );

    cloudStorageUtils.getFile( imageCloudPath, true, false, function(err, response) {
      if ( err ) {
        callback( err );

      } else {
        var emailAttachment = {
            fileName: attachmentName
          , streamSource: response
          , cid: attachmentName
        };
        emailAttachments.push( emailAttachment );
        callback( null, templateData, emailAttachments );
      }
    });
  }
}

//callback should return err, modelTemplateData, emailAttachments
exports.getAttachmentTemplateData = function( user, attachment, resourceType, isPreview, callback ) {

  var templateData = {};
  var emailAttachments = [];

  templateData['filename'] = attachment.filename;
  templateData['docType'] = attachment.docType;
  templateData['fileSize'] = utils.formatFileSize( attachment.fileSize );
  templateData['fileIcon'] = emailTemplates.getFileIconURL( attachment.docType );
  if ( resourceType === 'image' ) {
    templateData['isImage'] = true;
  } else {
    templateData['isAttachment'] = true;
  }

  if ( resourceType !== 'image' ) {
    callback( null, templateData, emailAttachments );

  } else if ( isPreview ) {
    templateData['attachmentImage'] = attachmentUtils.getSignedImageURL( attachment );
    callback( null, templateData, emailAttachments );

  } else {
    var attachmentName = 'attachment1';
    templateData['attachmentImage'] = 'cid:' + attachmentName;
    var imageCloudPath = attachmentUtils.getImageCloudPath( attachment );

    cloudStorageUtils.getFile( imageCloudPath, true, false, function(err, response) {
      if ( err ) {
        callback( err );

      } else {
        var emailAttachment = {
            fileName: attachmentName
          , streamSource: response
          , cid: attachmentName
        };
        emailAttachments.push( emailAttachment );
        callback( null, templateData, emailAttachments );
      }
    });
  }
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