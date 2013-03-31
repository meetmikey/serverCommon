var serverCommon = process.env.SERVER_COMMON;

var imageUtils = require (serverCommon + '/lib/imageUtils')
    , winston = require (serverCommon + '/lib/winstonWrapper').winston
    , fs = require ('fs');

var imageResizeTest = this;
var testFiles = ['./test/data/fist.png', './test/data/image.tiff', './test/data/obama_emails.jpg', './test/data/needs_crop.png', './test/data/wide.png', './test/data/wide2.png'];

exports.testBuffer = function (path, name, contentType) {

  fs.readFile(path, function (err, data) {
    if (err) throw err;

    imageUtils.generateThumbnailForImagesTab ("test/buffer_" + name, data, true, contentType, function (err, needsThumb) {
      if (err) {
        winston.handleError (err);
      }
      else if (!needsThumb) {
        winston.info ('rollover thumbnail not generated because image is already small');
      }
      else {
        winston.info ('done resizing image');
      }
    });

    imageUtils.generateThumbnailForRollover ("test/buffer_rollover_" + name, data, true, contentType, function (err, needsThumb) {
      if (err) {
        winston.handleError (err);
      }
      else if (!needsThumb) {
        winston.info ('thumbnail not generated because image is already small');
      }
      else {
        winston.info ('done resizing image');
      }
    });

  });

}

exports.testStreaming = function (path, name, contentType) {

  var rs = fs.createReadStream(path);

  imageUtils.generateThumbnailForImagesTab ("stream_" + name, rs, false, contentType, function (err, needsThumb) {
    if (err) {
      winston.handleError (err);
    }
    else if (!needsThumb) {
      winston.info ('thumbnail not generated because image is already small');
    }
    else {
      winston.info ('done resizing image');
    }
  });

  var rs2 = fs.createReadStream(path);

  imageUtils.generateThumbnailForRollover ("stream_rollover_" + name, rs2, false, contentType, function (err, needsThumb) {
    if (err) {
      winston.handleError (err);
    }
    else if (!needsThumb) {
      winston.info ('thumbnail not generated because image is already small');
    }
    else {
      winston.info ('done resizing image');
    }
  });

}

testFiles.forEach (function (file) {
  var fileLen = file.length;
  var ext = file.substring (fileLen - 4, fileLen);
  var contentType = "image/png";

  if (ext == '.jpg') {
    contentType = "image/png";
  }
  else if (ext == 'tiff') {
    contentType = "image/tiff";
  }

  var fileSplit = file.split ('/');
  var newName = fileSplit [fileSplit.length - 1];

  imageResizeTest.testBuffer (file, newName, contentType);
  imageResizeTest.testStreaming (file, newName, contentType);

});