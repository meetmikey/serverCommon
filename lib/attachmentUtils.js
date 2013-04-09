
var attachmentUtils = this;


exports.getFileContentId = function( attachment ) {

  if ( ! attachment ) {
    winston.doMissingParamError('attachment');
    return '';
  }

  return attachment.hash + '_' + attachment.fileSize
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