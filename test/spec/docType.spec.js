var serverCommon = process.env.SERVER_COMMON;

var attachmentUtils = require (serverCommon + '/lib/attachmentUtils');

describe ('docType', function () {
  it ('photoshop', function () {
    var inputs = ['image/psd', 'image/vnd.adobe.photoshop'];
    var output = 'photoshop';
    inputs.forEach (function (input) {
      expect (attachmentUtils.getDocType (input)).toBe (output);
    });
  });

  it ('image', function () {
    var inputs = ['image/png', 'image/gif', 'image/xgif'];
    var output = 'image';
    inputs.forEach (function (input) {
      expect (attachmentUtils.getDocType (input)).toBe (output);
    });
  });

});