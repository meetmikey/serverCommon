var gm = require ('gm')
    , constants = require ('../constants')
    , winston = require ('./winstonWrapper').winston
    , fs = require ('fs');

var thumbnailGen = this;

/*
define ('ROLLOVER_THUMBNAIL_WIDTH', 152);
define ('ROLLOVER_THUMBNAIL_HEIGHT', 152);

define ('IMAGE_TAB_FIXED_WIDTH', 250);
define ('IMAGE_TAB_MAX_HEIGHT', 750);
define ('IMAGE_TAB_MIN_HEIGHT', 100);
*/


exports.generateThumbnailForRollover = function (bufferOrStream, isBuffer, callback) {
  thumbnailGen.getImageProperties (function (err, properties) {
    if (err) { callback (err); return; }
    
    var size = properties.size;

    // 152 * 152, with the center decided on by whether image is 

  });
}

exports.generateThumbnailForImagesTab = function (bufferOrStream, isBuffer, callback) {
  thumbnailGen.getImageProperties (function (err, properties) {
    if (err) { callback (err); return; }
    
    var size = properties.size;

    // always resize so that the width is 250 px
    // while maintaining aspect ratio
    var factor = size.width/250;

    var newWidth = constants.IMAGE_TAB_FIXED_WIDTH;
    var newHeight = size.height * factor;
    var needsCrop = false;
    var cropHeight;
    var cropWidth;

    // never make thumbnails that are bigger...
    if (factor > 1) {
      var needsThumb = false;
      callback (null, needsThumb);
      return;
    }
    else {

      // see if we need to crop the height after resizing
      if (newHeight > size.IMAGE_TAB_MAX_HEIGHT) {
        needsCrop = true;
        cropHeight = constants.IMAGE_TAB_MAX_HEIGHT;
        cropWidth = constants.IMAGE_TAB_FIXED_WIDTH;

        thumbnailGen.resizeAndCropImageInMemory ()
      }
      else {

      }

    }

    // Crops the image to the given width and height at the given x and y position.
    // gm("img.png").crop(width, height, x, y)

  });
}

exports.convertTiffImage = function (buffer, callback) {
  // TODO
}

exports.getImageProperties = function (bufferOrStream, callback) {
  // output all available image properties
  gm(bufferOrStream)
  .identify(function (err, data) {
    callback (winston.makeError ('error getting image properties', err), data);
  });
}


exports.resizeAndCropImageInMemory = function (buffer, x, y, needsCrop, cropParams, callback) {
  console.log ('resizing image');
  var ops = gm(buffer);
  ops.resize(x, y);


  .stream(function (err, stdout, stderr) {
    var writeStream = fs.createWriteStream('./resized.png');
    stdout.pipe(writeStream);
    callback(err);
  });

}

exports.resizeAndCropImageStream = function (stream, x, y, needsCrop, cropParams, callback) {
  gm(stream, 'image.jpg')
  .resize(x, y)
  .stream(function (err, stdout, stderr) {
    var writeStream = fs.createWriteStream('./resized2.png');
    stdout.pipe(writeStream);
    callback (err);
  });
}

exports.cropToCenterInMemory = function (buffer, callback) {

}

exports.cropToCenterStreaming = function (stream, callback) {

}

exports.pipeStreamToS3 = function (originalPath, stream, callback) {
  
}

exports.putBufferToS3 = function (originalPath, buffer, callback) {

}

exports.getThumbnailPath = function (originalPath) {
  return originalPath + '_thumb'
}