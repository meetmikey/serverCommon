var serverCommon = process.env.SERVER_COMMON;

var thumbnailGen = require (serverCommon + '/lib/thumbnailGen')
    , winston = require (serverCommon + '/lib/winstonWrapper').winston
    , fs = require ('fs');

var imageResizeTest = this;
var testFiles = ['./test/data/fist.png', './test/data/obama_emails.jpg', './test/data/needs_crop.png', './test/data/wide.png', './test/data/wide2.png'];

exports.testBuffer = function (path, name, contentType) {

  fs.readFile(path, function (err, data) {
    if (err) throw err;

    thumbnailGen.generateThumbnailForImagesTab ("buffer_" + name, data, true, contentType, function (err, needsThumb) {
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

    thumbnailGen.generateThumbnailForRollover ("buffer_rollover_" + name, data, true, contentType, function (err, needsThumb) {
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

  thumbnailGen.generateThumbnailForImagesTab ("stream_" + name, rs, false, contentType, function (err, needsThumb) {
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

  thumbnailGen.generateThumbnailForRollover ("stream_rollover_" + name, rs2, false, contentType, function (err, needsThumb) {
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
  var ext = file.substring (fileLen - 4, fileLen - 1);
  var contentType = "image/png";

  if (ext == 'jpg') {
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
