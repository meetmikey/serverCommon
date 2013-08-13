var azureUtils = require ('./azureUtils'),
    s3Utils = require ('./s3Utils'),
    webUtils = require ('./webUtils'),
    utils = require ('./utils'),
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
    winston.doWarn('cloudStorageUtils: getAttachmentPath: no attachment');
    return '';
  }
  var fileContentId = attachmentUtils.getFileContentId( attachment );
  var base = useAzureDefault ? conf.azure.blobFolders.attachment : conf.aws.s3Folders.attachment;
  return base + '/' + fileContentId;
}

exports.getLinkInfoPath = function(linkInfo) {
  if ( ! linkInfo ) {
    winston.doWarn('cloudStorageUtils: getLinkInfoS3Path: no linkInfo');
    return '';
  }
  if ( ! linkInfo.comparableURLHash ) {
    winston.doWarn('cloudStorageUtils: getLinkInfoS3Path: no linkInfo comparableURLHash');
    return '';
  }

  var base = useAzureDefault ? conf.azure.blobFolders.linkInfo : conf.aws.s3Folders.linkInfo;
  return base + '/' + linkInfo.comparableURLHash;
}

exports.getImageCloudPathFromURL = function( url, useAzure ) {

  if ( ! url ) { winston.doWarn('cloudStorageUtils: getImageCloudPathFromURL: no url'); }

  var cloudPath = useAzure ?
    azureUtils.getImageCloudPathFromURL( url ) :
    s3Utils.getImageCloudPathFromURL( url );

  return cloudPath;
}

exports.downloadAndSaveImage = function( url, useAzure, callback ) {

  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  var cloudPath = cloudStorageUtils.getImageCloudPathFromURL( url );
  var useGzip = false;
  webUtils.webGet( url, false, function( err, response, resolvedURL ) {
    if ( err ) {
      callback( err );

    } else {
      var headers = cloudStorageUtils.getUploadHeadersFromResponse( response, useAzure );
      if ( headers['Content-Length'] ) {
        cloudStorageUtils.putStream( response, cloudPath, headers, useGzip, useAzure, callback );
      } else {
        winston.doWarn('cloudStorageUtils: downloadAndSaveImage: no content length while saving image, cannot putStream, must putBuffer', {url: url});
        utils.streamToBuffer( response, false, function(err, buffer) {
          if ( err ) {
            callback( err );

          } else {
            cloudStorageUtils.putBuffer( buffer, cloudPath, headers, useGzip, useAzure, callback );
          }
        });
      }
    }
  });
}

exports.getUploadHeadersFromResponse = function( response, useAzure ) {
  useAzure = useAzure || useAzureDefault;

  var headers = useAzure ?
    azureUtils.getUploadHeadersFromResponse( response ) :
    s3Utils.getUploadHeadersFromResponse( response );

  return headers;
}

exports.putBuffer = function(buffer, cloudPath, headers, useGzip, putInAzure, callback) {
  utils.runWithRetries( cloudStorageUtils.putBufferNoRetry, constants.CLOUD_STORAGE_RETRIES, callback,
    buffer, cloudPath, headers, useGzip, putInAzure );
}

exports.putBufferNoRetry = function(buffer, cloudPath, headers, useGzip, putInAzure, callback) {
  var useAzure = putInAzure || useAzureDefault;

  useAzure ?
    azureUtils.putBuffer( buffer, cloudPath, headers, useGzip, callback ) :
    s3Utils.putBuffer( buffer, cloudPath, headers, useGzip, callback );
}

exports.putStream = function( stream, cloudPath, headers, useGzip, putInAzure, callback ) {
  utils.runWithRetries( cloudStorageUtils.putStreamNoRetry, constants.CLOUD_STORAGE_RETRIES, callback,
    stream, cloudPath, headers, useGzip, putInAzure );
}

exports.putStreamNoRetry = function( stream, cloudPath, headers, useGzip, putInAzure, callback ) {
  var useAzure = putInAzure || useAzureDefault;

  useAzure ?
    azureUtils.putStream( stream, cloudPath, headers, useGzip, callback ) :
    s3Utils.putStream( stream, cloudPath, headers, useGzip, callback );
}

exports.getFile = function(cloudPath, useGzip, getFromAzure, callback) {
  utils.runWithRetries( cloudStorageUtils.getFileNoRetry, constants.CLOUD_STORAGE_RETRIES, callback,
    cloudPath, useGzip, getFromAzure );
}

exports.getFileNoRetry = function(cloudPath, useGzip, getFromAzure, callback) {

  var useAzure = getFromAzure || useAzureDefault;

  useAzure ? 
    azureUtils.getFile (cloudPath, useGzip, callback) : 
    s3Utils.getFile (cloudPath, useGzip, callback);
}

exports.deleteFile = function( cloudPath, inAzure, callback ) {
  utils.runWithRetries( cloudStorageUtils.deleteFileNoRetry, constants.CLOUD_STORAGE_RETRIES, callback,
    cloudPath, inAzure );
}

exports.deleteFileNoRetry = function( cloudPath, inAzure, callback ) {

  var useAzure = inAzure || useAzureDefault;

  useAzure ? 
    azureUtils.deleteFile (cloudPath, callback) : 
    s3Utils.deleteFile (cloudPath, callback);
}