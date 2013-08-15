var serverCommon = process.env.SERVER_COMMON;

var gm = require ('gm')
    , constants = require ('../constants')
    , winston = require ('./winstonWrapper').winston
    , utils = require ('./utils')
    , mongoose = require (serverCommon + '/lib/mongooseConnect').mongoose
    , async = require ('async')
    , sqsConnect = require (serverCommon + '/lib/sqsConnect')
    , cloudStorageUtils = require ('./cloudStorageUtils');

var imageUtils = this;
var LinkInfoModel = mongoose.model ('LinkInfo');
var AttachmentModel = mongoose.model ('Attachment');
var LinkModel = mongoose.model ('Link');
var AttachmentInfoModel = mongoose.model ('AttachmentInfo');


exports.pushThumbnailJobToQueue = function (isQuick, job, callback) {
  var pushFunction = sqsConnect.addMessageToThumbnailQueue;
  if (isQuick) {
    pushFunction = sqsConnect.addMessageToThumbnailQuickQueue;
  }

  pushFunction (job, callback);
}

exports.doThumbnailingJob = function (job, callback) {
  var originalPath = job.cloudPath;
  var isRollover = job.isRollover;
  var resourceId = job.resourceId;
  var modelName = job.modelName;

  if (typeof originalPath === 'undefined' || typeof isRollover === 'undefined' ||
      typeof resourceId === 'undefined' || modelName === 'undefined') {
    callback (winston.makeError ('Invalid parameters for thumbnail job', {job : job}));
    return;
  }

  cloudStorageUtils.getFile (originalPath, false, false, function (err, res) {
    if (err) {
      if (err.extra && err.extra.statusCode === "404") {
        // TODO: we should update the db to reflect the fact that there's a upload promised that doesn't exist
        callback (winston.makeError ('Could not get file for thumbnail job', {err : err, path : originalPath, deleteFromQueue : true}));
      } else {
        callback (winston.makeError ('Could not get file for thumbnail job', {err : err, path : originalPath}));
      }
      return;
    }

    var contentType = res.headers ["content-type"];

    if (typeof contentType === 'undefined') {
      callback (winston.makeError ("s3File doesn't have content type", {originalPath : originalPath, headers : res.headers}));
      return;
    }

    // rollover thumbnails
    if (isRollover) {
      imageUtils.doRolloverThumbnailJob (job, res, callback);
    }
    // attachment thumbnails
    else {
      imageUtils.doAttachmentThumbnailJob (job, res, callback);
    }

  });
  
}


exports.doRolloverThumbnailJob = function (job, s3Res, callback) {
  var resourceId = job.resourceId;
  var modelName = job.modelName;
  var comparableURLHash = job.comparableURLHash;
  var originalPath = job.cloudPath;
  var contentType = s3Res.headers ["content-type"];

  imageUtils.generateThumbnailForRollover (originalPath, s3Res, false, contentType, function (err) {
    if (err) {

      // for this error we still delete message from queue
      if (err.getImagePropertiesError) {
        var logData = {
          err : err,
          message : err.message,
          stack : err.stack,
          comparableURLHash : comparableURLHash
        };

        winston.doWarn ("getImagePropertiesError", logData);
        LinkInfoModel.update ({_id : resourceId},
          {$set : {imageThumbErr : true}},
          function (err, num) {
            if (err) {
              callback (winston.makeMongoError (err));
            }
            else if (num === 0) {
              callback (winston.makeError ('Zero records affected when updating imageThumbErr'));
            }
            else {
              callback();
            }
          });
      }
      else {
        callback (err);
      }
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
              var query = {comparableURLHash : comparableURLHash};
              // update links
              LinkModel.update (query,
                {$set : {imageThumbExists : true}},
                {multi : true},
                function (err) {
                if (err) {
                  callback (winston.makeMongoError (err));
                } else {
                  imageUtils.createCacheInvalidationJobs(LinkModel, query, callback);
                }
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


exports.doAttachmentThumbnailJob = function (job, s3Res, callback) {
  var hash = job.hash;
  var fileSize = job.fileSize;
  var originalPath = job.cloudPath;
  var resourceId = job.resourceId;
  var contentType = s3Res.headers ["content-type"];

  var updateSet;
  var query = {hash : hash, fileSize: fileSize};
  var updateAttachments = false;

  imageUtils.generateThumbnailForImagesTab (originalPath, s3Res, false, contentType, function (err, needsThumb) {
    if (err) {
      // special error - we delete object from queue since we've logged that this 
      // file is not processable by graphicsmagick
      if (err.getImagePropertiesError) {

        var logData = {
          err : err,
          message : err.message,
          stack : err.stack,
          hash : hash,
          fileSize : fileSize
        };

        winston.doWarn ("getImagePropertiesError", logData);
        updateSet = {$set : {"attachmentThumbErr" : true}};
      }
      else {
        callback (err);
        return;
      }
    }
    else if (!needsThumb) {
      // the attachment doesn't need a thumbnail generate for it
      updateSet = { $set : {"attachmentThumbSkip" : true}};
    }
    else {
      updateAttachments = true;
      updateSet = { $set : {"attachmentThumbExists" : true}};
    }

    AttachmentInfoModel.update (
      {_id : resourceId},
      updateSet,
      function (err, num) {
        if (err) {
          callback (winston.makeMongoError (err));
        }
        else if (num === 0) {
          callback (winston.makeError ('Zero records affected when updating attachmentInfoModel', {resourceId : resourceId}));
        }
        else {
          if ( ! updateAttachments ) {
            callback();

          } else {
            AttachmentModel.update (query,
              updateSet,
              {multi : true},
              function (err, num) {
                if (err) {
                  callback (winston.makeMongoError (err));
                }
                else if (num === 0) {
                  callback (winston.makeError ('Zero records affected when updating attachment model after generating thumb', {path : originalPath, hash : hash, fileSize: fileSize}));
                }
                else {
                  imageUtils.createCacheInvalidationJobs(AttachmentModel, query, callback);
                }
              }
            );
          }
        }
      });
  });
}


exports.generateThumbnailForRollover = function (originalPath, bufferOrStream, isBuffer, contentType, callback) {
  if (isBuffer) {
    imageUtils.generateThumbnailForRolloverFromBuffer (originalPath, bufferOrStream, contentType, callback);
  }
  else {
    utils.streamToBuffer (bufferOrStream, false, function (err, buffer) {
      if (err) {
        callback (winston.makeError ('Could not stream to buffer', {err : err, msg : err.message, stack : err.stack}));
      }
      else {
        imageUtils.generateThumbnailForRolloverFromBuffer (originalPath, buffer, contentType, callback);
      }
    });
  }
}

exports.checkInvertedWidthHeight = function (orientation) {
  
  var invertedOrientations = [
    'lefttop'
    , 'righttop'
    , 'rightbottom'
    , 'leftbottom'
  ]

  if (!orientation) {
    return false;
  }

  return invertedOrientations.indexOf (orientation.toLowerCase()) !== -1;
}

exports.generateThumbnailForRolloverFromBuffer = function (originalPath, buffer, contentType, callback) {
  var thumbnailPath = imageUtils.getThumbnailPath (originalPath);

  imageUtils.getImageProperties (buffer, originalPath, function (err, properties) {
    if (err) { callback (err); return; }
    

    var invertedWidthHeight = imageUtils.checkInvertedWidthHeight (properties.Orientation);
    var size = properties.size;

    var temp;
    if (invertedWidthHeight) {
      winston.doInfo ('invertedWidthHeight');
      temp = size.width;
      size.width = size.height;
      size.height = temp;
    }

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
    utils.streamToBuffer (bufferOrStream, false, function (err, buffer) {
      if (err) {
        callback (winston.makeError ('Could not stream to buffer', {err : err, message : err.message, stack : err.stack}));
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
    if (err) { callback (err); return; }
    
    var size = properties.size;
    var invertedWidthHeight = imageUtils.checkInvertedWidthHeight (properties.Orientation);

    var temp;
    if (invertedWidthHeight) {
      winston.doInfo ('invertedWidthHeight');
      temp = size.width;
      size.width = size.height;
      size.height = temp;
    }

    // always resize so that the width is 250 px
    // while maintaining aspect ratio
    var factor = constants.IMAGE_TAB_FIXED_WIDTH/size.width;

    var newWidth = constants.IMAGE_TAB_FIXED_WIDTH;
    var newHeight = size.height * factor;
    var needsCrop = false;
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
      // we handle these errors differently...
      err.getImagePropertiesError = true;
      callback (err);
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
  ops.autoOrient();
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
  winston.doInfo ('imageUtils: putStreamToS3', {path : thumbnailPath});

  // convert to buffer since we need "content-length" header
  utils.streamToBuffer (stream, false, function (err, buffer) {
    if (err) {
      callback (winston.makeError ('Thumbnail gen. Problem converting stream to buffer', err))
    }
    else {
      winston.doInfo ('imageUtils: streamToBuffer', {path : thumbnailPath});

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


exports.createCacheInvalidationJobs = function (Model, query, callback) {

  var q = Model.find (query);
  q.select ('_id');
  q.exec (function (err, models) {
    if (err) {
      callback (winston.makeMongoError (err));
    } else {

      async.each (models, function (model, cb) {
        winston.doInfo ('invalidation job created for model', {model : model});

        var invalidateJob = {
          _id : model._id
        }

        sqsConnect.addMessageToCacheInvalidationQueue (invalidateJob, function (err) {
          if (err) {
            cb (err);
          } else {
            cb();
          }
        });

      }, function (err) {
        callback (err);
      });
    }
  });

}
