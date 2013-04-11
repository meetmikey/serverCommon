
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
    winston.warn('attachmentUtils: getFileContentId: no attachment fileSize');
  }

  var fileContentId = attachment.hash + '_' + attachment.fileSize;
  return fileContentId;
}

exports.isATTFile = function(filename) {
  if ( ! filename ) {
    return false;
  }
  var regEx = /ATT[\d]{1,6}[\.]{1,2}txt/i;
  var matches = filename.match( regEx );
  if ( matches ) {
    return true;
  }
  return false;
}