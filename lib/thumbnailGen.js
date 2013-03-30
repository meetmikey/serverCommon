var gm = require ('gm')
    , constants = require ('../constants')
    , winston = require ('./winstonWrapper').winston
    , fs = require ('fs')
    , utils = require ('./utils')
    , cloudStorageUtils = require ('./cloudStorageUtils');

var thumbnailGen = this;

/*
define ('ROLLOVER_THUMBNAIL_SIZE', 152);

define ('IMAGE_TAB_FIXED_WIDTH', 250);
define ('IMAGE_TAB_MAX_HEIGHT', 750);
define ('IMAGE_TAB_MIN_HEIGHT', 100);
*/


exports.generateThumbnailForRollover = function (originalPath, bufferOrStream, isBuffer, contentType, callback) {
  if (isBuffer) {
    thumbnailGen.generateThumbnailForRolloverFromBuffer (originalPath, bufferOrStream, contentType, callback);
  }
  else {
    utils.streamToBuffer (bufferOrStream, function (err, buffer) {
      if (err) {
        callback (winston.makeError ('Could not stream to buffer', {err : err}));
      }
      else {
        thumbnailGen.generateThumbnailForRolloverFromBuffer (originalPath, buffer, contentType, callback);
      }
    });
  }
}

exports.generateThumbnailForRolloverFromBuffer = function (originalPath, buffer, contentType, callback) {
  var thumbnailPath = thumbnailGen.getThumbnailPath (originalPath);

  thumbnailGen.getImageProperties (buffer, function (err, properties) {
    if (err) { callback (err); return; }
    
    var size = properties.size;
    var isLong = false;
    var factor;
    var needsCrop = false;
    var cropHeight = constants.ROLLOVER_THUMBNAIL_SIZE;
    var cropWidth = constants.ROLLOVER_THUMBNAIL_SIZE;
    var cropParams = {};
    var newWidth;
    var newHeight;

    if (size.height > size.width) {
      isLong = true;
    }

    // take shortest dimension and set it to thumbnail size
    // then crop from middle so we have a square
    if (isLong) {
      factor = constants.ROLLOVER_THUMBNAIL_SIZE/size.width;

      newHeight = size.height * factor;
      newWidth = constants.ROLLOVER_THUMBNAIL_SIZE;

      if (newHeight > constants.ROLLOVER_THUMBNAIL_SIZE) {
        needsCrop = true;

        cropParams = {
          height : cropHeight,
          width : cropWidth,
          x : 0,
          y : 0
        };
      }

    }
    else {
      factor = constants.ROLLOVER_THUMBNAIL_SIZE/size.height;

      newWidth = size.width * factor;
      newHeight = constants.ROLLOVER_THUMBNAIL_SIZE;

      if (newWidth > constants.ROLLOVER_THUMBNAIL_SIZE) {
        needsCrop = true;

        cropParams = {
          height : cropHeight,
          width : cropWidth,
          x : newWidth/2 - constants.ROLLOVER_THUMBNAIL_SIZE/2,
          y : 0
        };
      
      }

    }
 
    thumbnailGen.resizeAndCropImage (thumbnailPath, buffer, newWidth, newHeight, needsCrop, cropParams, contentType, callback);

  });
}

exports.generateThumbnailForImagesTab = function (originalPath, bufferOrStream, isBuffer, contentType, callback) {
  if (isBuffer) {
    thumbnailGen.generateThumbnailForImagesTabFromBuffer (originalPath, bufferOrStream, contentType, callback);
  }
  else {
    utils.streamToBuffer (bufferOrStream, function (err, buffer) {
      if (err) {
        callback (winston.makeError ('Could not stream to buffer', {err : err}));
      }
      else {
        thumbnailGen.generateThumbnailForImagesTabFromBuffer (originalPath, buffer, contentType, callback);
      }
    });
  }
}

exports.generateThumbnailForImagesTabFromBuffer = function (originalPath, buffer, contentType, callback) {
  var thumbnailPath = thumbnailGen.getThumbnailPath (originalPath);

  thumbnailGen.getImageProperties (buffer, function (err, properties) {
    if (err) { callback (winston.makeError ('could not get image properties', {err : err})); return; }
    
    var size = properties.size;

    // always resize so that the width is 250 px
    // while maintaining aspect ratio
    var factor = constants.IMAGE_TAB_FIXED_WIDTH/size.width;

    var newWidth = constants.IMAGE_TAB_FIXED_WIDTH;
    var newHeight = size.height * factor;
    var needsCrop = false;
    var cropHeight;
    var cropWidth;
    var cropParams = {};

    // never make thumbnails that are bigger...
    if (factor > 1) {
      var needsThumb = false;
      callback (null, needsThumb);
      return;
    }
    else {
      // see if we need to crop the height after resizing
      if (newHeight > constants.IMAGE_TAB_MAX_HEIGHT) {
        needsCrop = true;
        cropParams.height = constants.IMAGE_TAB_MAX_HEIGHT;
        cropParams.width = constants.IMAGE_TAB_FIXED_WIDTH;
        cropParams.x = 0;
        cropParams.y = 0;
      }
    }

    thumbnailGen.resizeAndCropImage (thumbnailPath, buffer, newWidth, newHeight, needsCrop, cropParams, contentType, callback);

  });
}

exports.convertTiffImage = function (buffer, callback) {
  // TODO
}

exports.getImageProperties = function (buffer, callback) {
  // output all available image properties
  gm(buffer)
  .identify(function (err, data) {
    if (err) {
      callback (winston.makeError ('error getting image properties', err));
      return;
    }

    callback (null, data);
  });
}

exports.resizeAndCropImage = function (thumbnailPath, buffer, resizeX, resizeY, needsCrop, cropParams, contentType, callback) {
  winston.doInfo ('resizeAndCropImage', {path : thumbnailPath, needsCrop : needsCrop});
  var ops = gm(buffer);
  ops.resize(resizeX, resizeY);

  if (needsCrop) {
    ops.crop (cropParams.width, cropParams.height, cropParams.x, cropParams.y);
  }
  
  ops.stream(function (err, stdout, stderr) {
    if (err) {
      callback (winston.makeError ('Error resizeAndCropImage', {errMsg : err.message, errStack : err.stack, stderr : stderr}));      
      return;
    }

    thumbnailGen.putStreamToS3 (thumbnailPath, stdout, contentType, callback);
  });

}

exports.putStreamToS3 = function (thumbnailPath, stream, contentType, callback) {
  winston.info ('putStreamToS3');

  // convert to buffer since we need "content-length" header
  utils.streamToBuffer (stream, function (err, buffer) {
    if (err) {
      callback (winston.makeError ('Thumbnail gen. Problem converting stream to buffer', err))
    }
    else {

      var useGzip = false;
      var putInAzure = false;

      var headers = {
        "Content-Type" : contentType,
        "Content-Length" : buffer.length,
        "x-amz-storage-class" : "REDUCED_REDUNDANCY"
      }

      cloudStorageUtils.putBuffer (buffer, thumbnailPath, headers, useGzip, putInAzure, function (err) {
        if (err) {
          callback (err);
        }
        else {
          var needsThumb = true;
          callback (null, needsThumb);
        }
      });
    }

  })


}

exports.getThumbnailPath = function (originalPath) {
  return originalPath + '_thumb'
}