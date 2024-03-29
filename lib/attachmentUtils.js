var constants = require ('../constants')
  , cloudStorageUtils = require('./cloudStorageUtils')
  , winston = require ('./winstonWrapper').winston


var attachmentUtils = this;

//the argument here can be either an attachment or an attachmentInfo, since both have hash + fileSize
exports.getFileContentId = function( attachment ) {

  if ( ! attachment ) {
    winston.doMissingParamError('attachment');
    return '';
  }
  if ( ! attachment.hash ) {
    winston.doMissingParamError('attachment.hash');
    return '';
  }
  if ( ! attachment.fileSize ) {
    winston.doWarn('attachmentUtils: getFileContentId: no attachment fileSize');
  }

  var fileContentId = attachment.hash + '_' + attachment.fileSize;
  return fileContentId;
}

exports.isATTFile = function(filename) {
  if ( ! filename ) {
    return false;
  }
  var regEx = /ATT[\d]{1,6}[\.]{1,2}(txt|htm|html)/i;
  var matches = filename.match( regEx );
  if ( matches ) {
    return true;
  }
  return false;
}

exports.resourceDocTypeIndexable = function (docType, fileSize) {
  var bigExcelFile = false;
  if (docType == 'spreadsheet' && fileSize > constants.MAX_EXCEL_INDEX_SIZE) {
    bigExcelFile = true;
    winston.doInfo ("not indexing file contents because it's too big");
  } 

  return (docType != 'video' &&
          docType != 'image' && 
          docType != 'photoshop' &&
          docType != 'archive' &&
          !bigExcelFile)
}

exports.isAttachmentImage = function( attachment ) {
  if ( ! attachment || ! attachment.contentType) {
    return false;
  }

  // there are certain things which are images, but we don't include
  // in the images tab since they won't render properly in the browser
  return attachmentUtils.getDocType (attachment.contentType) === 'image' && 
          !attachmentUtils.excludeFromImages (attachment.contentType);

}

exports.isContentTypeCandidate = function (contentType, candidate) {
  if (!contentType) { return false; }
  var matchTerms = constants.DOC_TYPE_MAPPING[candidate];
  var matchTermsLen = matchTerms.length;
  var hasMatch = false;

  for (var i = 0; i < matchTermsLen; i++) {
    if (contentType.indexOf(matchTerms[i])>=0) {
      hasMatch = true;
      break;
    }
  }

  return hasMatch;

}

exports.excludeFromImages = function (contentType) {
  return constants.EXCLUDE_FROM_IMAGES.indexOf (contentType) != -1
}


exports.getDocType = function (contentType) {
  if (!contentType) {
    return 'other';
  }
  else if (attachmentUtils.isContentTypeCandidate (contentType, 'photoshop')) {
    return 'photoshop';    
  }
  else if (attachmentUtils.isContentTypeCandidate(contentType, 'image')) {
    return 'image';
  }
  else if (attachmentUtils.isContentTypeCandidate(contentType, 'pdf')) {
    return 'pdf';
  }
  else if (attachmentUtils.isContentTypeCandidate(contentType, 'document')) {
    return 'document';
  }
  else if (attachmentUtils.isContentTypeCandidate(contentType, 'spreadsheet')) {
    return 'spreadsheet';
  }
  else if (attachmentUtils.isContentTypeCandidate(contentType, 'presentation')) {
    return 'presentation';
  }
  else if (attachmentUtils.isContentTypeCandidate(contentType, 'music')) {
    return 'music';
  }
  else if (attachmentUtils.isContentTypeCandidate(contentType, 'video')) {
    return 'video';
  }
  else if (attachmentUtils.isContentTypeCandidate(contentType, 'archive')) {
    return 'archive';
  }
  else if (attachmentUtils.isContentTypeCandidate(contentType, 'code')) {
    return 'code';
  }
  else {
    return 'other';
  }

}

exports.getImageCloudPath = function( attachment ) {
  if ( ! attachment ) {
    return '';

  } else if ( ! attachmentUtils.isAttachmentImage( attachment ) ) {
    return '';

  } else {
    var suffix = '';
    if ( attachment.attachmentThumbExists ) {
      suffix = '_thumb';
    }
    var imageCloudPath = cloudStorageUtils.getAttachmentPath(attachment) + suffix;
    return imageCloudPath;
  }
}

exports.getSignedImageURL = function( attachment, expireTimeMinutesInput ) {
  if ( ! attachment ) {
    return '';

  } else if ( ! attachmentUtils.isAttachmentImage( attachment ) ) {
    return '';

  } else {
    var expireTimeMinutes = constants.DEFAULT_SIGNED_URL_EXPIRE_TIME_MINUTES;
    if ( expireTimeMinutesInput ) {
      expireTimeMinutes = expireTimeMinutesInput;
    }
    var imageCloudPath = attachmentUtils.getImageCloudPath( attachment );
    var signedImageURL = cloudStorageUtils.signedURL( imageCloudPath, expireTimeMinutes, attachment );
    return signedImageURL;
  }
}
