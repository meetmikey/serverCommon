var azureUtils = require ('./azureUtils'),
    s3Utils = require ('./s3Utils'),
    winston = require ('./winstonWrapper').winston,
    conf = require ('../conf'),
    fs = require ('fs'),
    attachmentUtils = require ('./attachmentUtils')
    urlUtils = require ('./urlUtils'),
    constants = require ('../constants');

var cloudStorageUtils = this;
var defaultCloud = constants.CLOUD_STORAGE_DEFAULT;
var useAzureDefault = false;

if (!defaultCloud) {
  winston.doWarn ('No default cloud environment provided. Using aws...');
}
else if (defaultCloud == 'azure') {
  useAzureDefault = true;
}

exports.markFailedUpload = function (model, modelName, query) {
  model.update (query, {$set : {failUpload : true}}, function (err, num) {
    if (err) { 
      winston.doError ('could not update model failed to uploadToS3', err); 
    }
    else if (num == 0) {
      winston.doWarn ('Zero records affected when marking failed upload', {query : query, model : modelName});
    }
  });
}

exports.signedURL = function(cloudPath, expiresMinutesInput, model) {
  return useAzureDefault ? 
    azureUtils.signedUrl (cloudPath, expiresMinutesInput, model) : 
    s3Utils.signedURL (cloudPath, expiresMinutesInput, model);
}

exports.getMailBodyPath = function (mail){
  return useAzureDefault ? 
    azureUtils.getMailBodyPath (mail) :
    s3Utils.getMailBodyPath (mail);
}

exports.getMailBodyPathFromResource = function (mailId) {
  return conf.aws.s3Folders.mailBody + '/' + mailId;
}

//the argument here can be either an attachment or an attachmentInfo, since both have hash + fileSize
exports.getAttachmentPath = function(attachment) {
  if ( ! attachment ) {
    winston.warn('cloudStorageUtils: getAttachmentPath: no attachment');
    return '';
  }
  var fileContentId = attachmentUtils.getFileContentId( attachment );
  var base = useAzureDefault ? conf.azure.blobFolders.attachment : conf.aws.s3Folders.attachment;
  return base + '/' + fileContentId;
}

exports.getLinkInfoPath = function(linkInfo) {
  if ( ! linkInfo ) {
    winston.warn('cloudStorageUtils: getLinkInfoS3Path: no linkInfo');
    return '';
  }
  if ( ! linkInfo.comparableURLHash ) {
    winston.warn('cloudStorageUtils: getLinkInfoS3Path: no linkInfo comparableURLHash');
    return '';
  }

  var base = useAzureDefault ? conf.azure.blobFolders.linkInfo : conf.aws.s3Folders.linkInfo;
  return base + '/' + linkInfo.comparableURLHash;
}

exports.getStaticPathFromImageURL = function( url ) {
  if ( ! url ) { winston.warn('cloudStorageUtils: getStaticPathFromImageURL: no url'); }
  var hash = urlUtils.hashURL(url);
  var base = useAzureDefault ? conf.azure.blobFolders.static : conf.aws.s3Folders.static;
  return base + '/' + hash;
}

exports.getHeadersFromResponse = function(response) {
  return useAzureDefault ? azureUtils.getHeadersFromResponse (response) : s3Utils.getHeadersFromResponse (response);
}

exports.downloadAndSaveStaticImage = function(url, callback) {
  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  var cloudPath = cloudStorageUtils.getStaticPathFromImageURL(url);
  
  urlUtils.resolveURL(url,
    function(err, resolvedURL, isHTTPS ) {

      if ( err ) {
        callback(err);

      } else if ( ! resolvedURL ) {
        callback( winston.makeError('no resolved URL') );

      } else {
        var downloadFunction = useAzureDefault ? 
          azureUtils.downloadAndSaveStaticHTTPImage : 
          s3Utils.downloadAndSaveStaticHTTPImage;
        
        if ( isHTTPS ) {
          downloadFunction = useAzureDefault ? 
            azureUtils.downloadAndSaveStaticHTTPSImage : 
            s3Utils.downloadAndSaveStaticHTTPSImage;
        }

        downloadFunction( resolvedURL, cloudPath, function(err) {
          if ( err ) {
            callback(err);
          } else {
            callback(null, cloudPath);
          }
        });
      }
    }
  );
}


exports.putBuffer = function(buffer, cloudPath, headers, useGzip, putInAzure, callback) {
  var useAzure = putInAzure || useAzureDefault;

  if ( useAzure ) {
    azureUtils.putBuffer (buffer, cloudPath, headers, useGzip, 0, callback);

  } else {
    if ( useGzip ) {
      s3Utils.putGzipBuffer( buffer, cloudPath, headers, callback );
    } else {
      s3Utils.putBuffer( buffer, cloudPath, headers, callback );
    }
  }
}

exports.putStream = function (stream, cloudPath, headers, useGzip, putInAzure, callback) {
  var useAzure = putInAzure || useAzureDefault;

  useAzure ?
    azureUtils.putStream (stream, cloudPath, headers, useGzip, callback) :
    s3Utils.putStream (stream, cloudPath, headers, useGzip, callback);

}

exports.getFile = function(cloudPath, useGzip, getFromAzure, callback) {
  var useAzure = getFromAzure || useAzureDefault;

  useAzure ? 
    azureUtils.getFile (cloudPath, useGzip, callback) : 
    s3Utils.getFile (cloudPath, useGzip, callback);
}

exports.deleteFile = function( cloudPath, inAzure, callback ) {
  var useAzure = inAzure || useAzureDefault;

  useAzure ? 
    azureUtils.deleteFile (cloudPath, callback) : 
    s3Utils.deleteFile (cloudPath, callback);
}

exports.createTmpErrorsDir = function () {
  // always create temp directory even if starting point doesn't match since this is local to fs
  var dir = constants.ERROR_UPLOADS_DIR;
  var subDirs = Object.keys(conf.aws.s3Folders);

  fs.exists (dir, function (exists) {
    if (exists) {
      winston.info ('Error base directory already exists');
    }
    else {
      // block but just during startup...
      fs.mkdirSync (dir); 

      subDirs.forEach (function (subDir) {
        //check existence
        fs.exists(dir + subDir, function (exists) {
          if (exists) {
            winston.info ('Error subdirectory already exists');
          }
          else {
            fs.mkdirSync (dir + subDir);
          }
        });
      });           
    }
  });

}

exports.printResponse = function (res, inAzure) {
  inAzure ?
    azureUtils.printAzureResponse (res) :
    s3Utils.printAWSResponse (res);
}

cloudStorageUtils.createTmpErrorsDir();