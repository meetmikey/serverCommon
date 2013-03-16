
var attachmentUtils = this;


exports.getFileContentId = function( attachment ) {

  if ( ! attachment ) {
    winston.doMissingParamError('attachment');
    return '';
  }

  return attachment.hash + '_' + attachment.fileSize
}