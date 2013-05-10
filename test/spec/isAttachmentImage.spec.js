var serverCommon = process.env.SERVER_COMMON;

var attachmentUtils = require (serverCommon + '/lib/attachmentUtils');

describe ('isAttachmentImage', function () {
  it ('not images', function () {
    var inputs = [{contentType : 'image/psd'}, 
      {contentType : 'image/vnd.adobe.photoshop'}, 
      {contentType : 'image/vnd.djvu'}, 
      {contentType: 'application/pdf'}];
    inputs.forEach (function (input) {
      console.log (input);
      expect (attachmentUtils.isAttachmentImage (input)).toBe (false);
    });
  });

  it ('image', function () {
    var inputs = [{contentType : 'image/png'}, {contentType : 'image/gif'}, {contentType : 'image/xgif'}];
    inputs.forEach (function (input) {
      console.log (input);
      expect (attachmentUtils.isAttachmentImage (input)).toBe (true);
    });
  });

});