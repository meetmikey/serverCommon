var azureUtils = require ('./azureUtils'),
    s3Utils = require ('./s3Utils'),
    constants = require ('../constants')

var cloudStorageUtils = this;
var defaultCloud = constants.CLOUD_STORAGE_DEFAULT;
var useAzureDefault = true;

if (!defaultCloud) {
  winston.doError ('No default cloud environment provided');
}
else if (defaultCloud == 'aws') {
  useAzureDefault = false;
}


exports.useAzure = function (model) {
  if (typeof model.inAzure === 'undefined') {
    return useAzureDefault;    
  }
  else {
    return model.inAzure;
  }
}

exports.signedURL = function(path, expiresMinutesInput, model) {
  var useAzure = cloudStorageUtils.useAzure (model);

  return useAzure ? azureUtils.signedUrl (path, expiresMinutesInput, model) : s3Utils.signedUrl (path, expiresMinutesInput, model);
}

exports.getAttachmentPath = function(attachment) {
  var useAzure = cloudStorageUtils.useAzure (attachment);

  if ( ! attachment ) {
    winston.warn('cloudStorageUtils: getAttachmentazurePath: no attachment');
    return '';
  }
  if ( ! attachment.hash ) {
    winston.warn('cloudStorageUtils: getAttachmentazurePath: no attachment hash');
    return '';
  }
  if ( ! attachment.fileSize ) {
    winston.warn('cloudStorageUtils: getAttachmentazurePath: no attachment fileSize');
  }

  var resourceId = attachment.hash + '_' + attachment.fileSize;
  var base = useAzure ? conf.azure.blobFolders.attachment : conf.aws.s3Folders.attachment;

  return base + '/' + resourceId;
}


exports.getLinkInfoPath = function(linkInfo) {
  var useAzure = cloudStorageUtils.useAzure (linkInfo);

  if ( ! linkInfo ) {
    winston.warn('cloudStorageUtils: getLinkInfoS3Path: no linkInfo');
    return '';
  }
  if ( ! linkInfo.comparableURLHash ) {
    winston.warn('cloudStorageUtils: getLinkInfoS3Path: no linkInfo comparableURLHash');
    return '';
  }

  var base = useAzure ? conf.azure.blobFolders.linkInfo : conf.aws.s3Folders.linkInfo;
  return base + '/' + linkInfo.comparableURLHash;
}

exports.getStaticPathFromImageURL = function( url ) {
  var useAzure = useAzureDefault;

  if ( ! url ) { winston.warn('cloudStorageUtils: getStaticPathFromImageURL: no url'); }
  var hash = urlUtils.hashURL(url);
  var base = useAzure ? conf.azure.blobFolders.static : conf.aws.s3Folders.static;
  return base + '/' + hash;
}

exports.getHeadersFromResponse = function(response) {
  var useAzure = useAzureDefault;
  return useAzure ? azureUtils.getHeadersFromResponse (response) : s3Utils.getHeadersFromResponse (response);
}

exports.downloadAndSaveStaticImage = function(url, callback) {
  var useAzure = useAzureDefault;

  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  var cloudPath = cloudStorageUtils.getStaticPathFromImageURL(url);
  
  urlUtils.resolveURL(url,
    function(err, resolvedURL, isHTTPS ) {

      if ( err ) {
        callback(err);

      } else if ( ! resolvedURL ) {
        callback( winston.makeError('no resolved URL') );

      } else {
        var downloadFunction = useAzure ? azureUtils.downloadAndSaveStaticHTTPImage : s3Utils.downloadAndSaveStaticHTTPImage;
        if ( isHTTPS ) {
          downloadFunction = useAzure ? azureUtils.downloadAndSaveStaticHTTPSImage : s3Utils.downloadAndSaveStaticHTTPSImage;
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


exports.putBuffer = function(buffer, cloudPath, headers, useGzip, callback) {
  var useAzure = useAzureDefault;
  useAzure ? azureUtils.putBuffer (buffer, cloudPath, headers, useGzip, callback) : s3Utils.putBuffer (buffer, cloudPath, headers, useGzip, callback);
}

exports.getFile = function(cloudPath, useGzip, callback) {
  var useAzure = useAzureDefault;
  useAzure ? azureUtils.getFile (cloudPath, useGzip, callback) : s3Utils.getFile (cloudPath, useGzip, callback);
}