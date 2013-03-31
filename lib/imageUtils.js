var serverCommon = process.env.SERVER_COMMON;

var gm = require ('gm')
    , constants = require ('../constants')
    , winston = require ('./winstonWrapper').winston
    , fs = require ('fs')
    , utils = require ('./utils')
    , mongoose = require (serverCommon + '/lib/mongooseConnect').mongoose
    , cloudStorageUtils = require ('./cloudStorageUtils');

var imageUtils = this;
var LinkInfoModel = mongoose.model ('LinkInfo');
var AttachmentModel = mongoose.model ('Attachment');
var LinkModel = mongoose.model ('Link');

exports.doThumbnailingJob = function (job, callback) {
  var originalPath = job.cloudPath;
  var isRollover = job.isRollover;
  var resourceId = job.resourceId;
  var modelName = job.modelName;
  var hash = job.hash;
  var fileSize = job.fileSize;
  var comparableURLHash = job.comparableURLHash;

  if (typeof originalPath === 'undefined' || typeof isRollover === 'undefined' ||
      typeof resourceId === 'undefined' || modelName === 'undefined' ||
      (typeof comparableURLHash === 'undefined' && modelName === 'LinkInfo')) {

    callback (winston.makeError ('Invalid parameters for thumbnail job', {job : job}));
    return;
  }

  cloudStorageUtils.getFile (originalPath, false, false, function (err, res) {
    var contentType = res.headers ["content-type"];
    if (typeof contentType === 'undefined') {
      callback (winston.makeError ("s3File doesn't have content type", {originalPath : originalPath, headers : res.headers}));
      return;
    }

    // rollover thumbnails
    if (isRollover) {
      imageUtils.generateThumbnailForRollover (originalPath, res, false, contentType, function (err) {
        if (err) {
          callback (err);
        }
        else {
          if (modelName === 'LinkInfo') {
            // update linkinfos
            LinkInfoModel.update ({_id : resourceId}, 
              {$set : {imageThumbExists : true}},
              function (err, num) {
                if (err) {
                  callback (winston.makeMongoError (err));
                }
                else if (num === 0) {
                  callback (winston.makeError ('Zero records affected when updating imageThumbExists'));
                }
                else {

                  // update links
                  LinkModel.update ({comparableURLHash : comparableURLHash}, 
                    {$set : {imageThumbExists : true}},
                    function (err, num) {
                    if (err) {
                      callback (winston.makeMongoError (err));
                      return;
                    }

                    callback();
                  });

                }
              });
          }
          else if (modelName === 'Attachment') {
            // TODO: implement when we have attachment rollovers
            callback (winston.makeError ('Thumbnailing for rollovers not implemented for attachments'));
          }
          else {
            callback (winston.makeError ('Thumbnailing for rollovers not implemented for model type', {modelName : modelName}));
          }
        }
      });
    }
    // regular thumbnails
    else {
      var updateSet;
      
      imageUtils.generateThumbnailForImagesTab (originalPath, res, false, contentType, function (err, needsThumb) {
        if (err) {
          callback (err);
          return;
        }
        else if (!needsThumb) {
          // the attachment doesn't need a thumbnail generate for it
          updateSet = { $set : {"attachmentThumbSkip" : true}};
        }
        else {
          updateSet = { $set : {"attachmentThumbExists" : true}};
        }

        var query = {hash : hash, fileSize: fileSize};

        AttachmentModel.update (query, 
          updateSet,
          function (err, num) {
            if (err) {
              callback (winston.makeMongoError (err));
            }
            else if (num === 0) {
              callback (winston.makeError ('Zero records affected when updating attachment model after generating thumb'));
            }
            else {
              callback();
            }
          });

      });
    }

  });
  
}


exports.generateThumbnailForRollover = function (originalPath, bufferOrStream, isBuffer, contentType, callback) {
  if (isBuffer) {
    imageUtils.generateThumbnailForRolloverFromBuffer (originalPath, bufferOrStream, contentType, callback);
  }
  else {
    utils.streamToBuffer (bufferOrStream, function (err, buffer) {
      if (err) {
        callback (winston.makeError ('Could not stream to buffer', {err : err}));
      }
      else {
        imageUtils.generateThumbnailForRolloverFromBuffer (originalPath, buffer, contentType, callback);
      }
    });
  }
}

exports.generateThumbnailForRolloverFromBuffer = function (originalPath, buffer, contentType, callback) {
  var thumbnailPath = imageUtils.getThumbnailPath (originalPath);

  imageUtils.getImageProperties (buffer, originalPath, function (err, properties) {
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
 
    imageUtils.resizeAndCropImage (thumbnailPath, buffer, newWidth, newHeight, needsCrop, cropParams, contentType, callback);

  });
}

exports.generateThumbnailForImagesTab = function (originalPath, bufferOrStream, isBuffer, contentType, callback) {
  if (isBuffer) {
    imageUtils.generateThumbnailForImagesTabFromBuffer (originalPath, bufferOrStream, contentType, callback);
  }
  else {
    utils.streamToBuffer (bufferOrStream, function (err, buffer) {
      if (err) {
        callback (winston.makeError ('Could not stream to buffer', {err : err}));
      }
      else {
        imageUtils.generateThumbnailForImagesTabFromBuffer (originalPath, buffer, contentType, callback);
      }
    });
  }
}

exports.generateThumbnailForImagesTabFromBuffer = function (originalPath, buffer, contentType, callback) {
  var thumbnailPath = imageUtils.getThumbnailPath (originalPath);

  imageUtils.getImageProperties (buffer, originalPath, function (err, properties) {
    if (err) { 
      callback (err);
      return; 
    }
    
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

    imageUtils.resizeAndCropImage (thumbnailPath, buffer, newWidth, newHeight, needsCrop, cropParams, contentType, callback);

  });
}

exports.getImageProperties = function (buffer, path, callback) {
  // output all available image properties
  gm(buffer)
  .identify(function (err, data) {
    if (err) {
      callback (winston.makeError ('error getting image properties', {err: err, path : path}));
      return;
    }

    callback (null, data);
  });
}

exports.resizeAndCropImage = function (thumbnailPath, buffer, resizeX, resizeY, needsCrop, cropParams, contentType, callback) {
  winston.doInfo ('resizeAndCropImage', {path : thumbnailPath, needsCrop : needsCrop, contentType : contentType});
  var needsConversion = false;
  var ops = gm(buffer);

  if (contentType == 'image/tiff') {
    needsConversion = true;
    contentType = 'image/png';
  }

  ops.resize(resizeX, resizeY);

  if (needsCrop) {
    ops.crop (cropParams.width, cropParams.height, cropParams.x, cropParams.y);
  }
  

  if (needsConversion) {
    winston.doInfo ('image needs conversion');
    ops.stream('png', function (err, stdout, stderr) {
      if (err) {
        callback (winston.makeError ('Error resizeAndCropImage', {errMsg : err.message, errStack : err.stack, stderr : stderr}));      
        return;
      }

      imageUtils.putStreamToS3 (thumbnailPath, stdout, contentType, callback);
    });
  }
  else {
    ops.stream(function (err, stdout, stderr) {
      if (err) {
        callback (winston.makeError ('Error resizeAndCropImage', {errMsg : err.message, errStack : err.stack, stderr : stderr}));      
        return;
      }

      imageUtils.putStreamToS3 (thumbnailPath, stdout, contentType, callback);
    });
  }

}

exports.putStreamToS3 = function (thumbnailPath, stream, contentType, callback) {
  winston.info ('putStreamToS3');

  // convert to buffer since we need "content-length" header
  utils.streamToBuffer (stream, function (err, buffer) {
    if (err) {
      callback (winston.makeError ('Thumbnail gen. Problem converting stream to buffer', err))
    }
    else {

      var useGzip = true;
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