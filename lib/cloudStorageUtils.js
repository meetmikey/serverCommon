var azureUtils = require ('./azureUtils'),
    s3Utils = require ('./s3Utils')

var cloudStorageUtils = this;
var defaultCloud = process.env.DEFAULT_CLOUD;
var useAzure = true;

if (!defaultCloud) {
  winston.doError ('No default cloud environment provided');
}
else if (defaultCloud == 'aws') {
  useAzure = false;
}

exports.signedURL = function(path, expiresMinutesInput, model) {
  return useAzure ? azureUtils.signedUrl (path, expiresMinutesInput, model) : s3Utils.signedUrl (path, expiresMinutesInput, model);
}

exports.getAttachmentPath = function(attachment) {
  
  if ( ! attachment ) {
    winston.warn('azureUtils: getAttachmentazurePath: no attachment');
    return '';
  }
  if ( ! attachment.hash ) {
    winston.warn('azureUtils: getAttachmentazurePath: no attachment hash');
    return '';
  }
  if ( ! attachment.fileSize ) {
    winston.warn('azureUtils: getAttachmentazurePath: no attachment fileSize');
  }

  var resourceId = attachment.hash + '_' + attachment.fileSize;
  var base = useAzure ? conf.azure.blobFolders.attachment : conf.aws.s3Folders.attachment;

  return base + '/' + resourceId;
}



exports.getLinkInfoPath = function(linkInfo) {
  
  if ( ! linkInfo ) {
    winston.warn('s3Utils: getLinkInfoS3Path: no linkInfo');
    return '';
  }
  if ( ! linkInfo.comparableURLHash ) {
    winston.warn('s3Utils: getLinkInfoS3Path: no linkInfo comparableURLHash');
    return '';
  }

  var s3Path = conf.aws.s3Folders.linkInfo + '/' + linkInfo.comparableURLHash;
  return s3Path;
}

exports.getStaticS3PathFromImageURL = function( url ) {
  if ( ! url ) { winston.warn('s3Utils: getStaticS3PathFromImageURL: no url'); }
  var hash = urlUtils.hashURL(url);
  var s3Path = conf.aws.s3Folders.static + '/' + hash;
  return s3Path;
}

exports.getHeadersFromResponse = function(response) {
  var headers = {
      'Content-Length': response.headers['content-length']
    , 'Content-Type': response.headers['content-type']
  };
  return headers;
}

exports.downloadAndSaveStaticImage = function(url, callback) {

  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  var s3Path = s3Utils.getStaticS3PathFromImageURL(url);
  
  urlUtils.resolveURL(url,
    function(err, resolvedURL, isHTTPS ) {

      if ( err ) {
        callback(err);

      } else if ( ! resolvedURL ) {
        callback( winston.makeError('no resolved URL') );

      } else {
        var downloadFunction = s3Utils.downloadAndSaveStaticHTTPImage;
        if ( isHTTPS ) {
          downloadFunction = s3Utils.downloadAndSaveStaticHTTPSImage;
        }

        downloadFunction( resolvedURL, s3Path, function(err) {
          if ( err ) {
            callback(err);
          } else {
            callback(null, s3Path);
          }
        });
      }
    }
  );
}

exports.downloadAndSaveStaticHTTPSImage = function(url, s3Path, callback) {

  var parsedURL = urlUtils.parseURL( url );
  var options = {
      host: parsedURL.host
    , port: 443
    , path: parsedURL.path
    , method: 'GET'
  }

  https.get( options, function( response ) {
    s3Utils.uploadResponseToS3( response, s3Path, callback );

  }).on( 'error', function( err ) {
    callback( winston.makeRequestError( err ) );
  });
}

exports.downloadAndSaveStaticHTTPImage = function(url, s3Path, callback) {
  
  http.get( url, function( response ) {
    s3Utils.uploadResponseToS3( response, s3Path, callback );

  }).on( 'error', function( err ) {
    callback( winston.makeRequestError( err ) );
  });
}

exports.uploadResponseToS3 = function(response, s3Path, callback) {
  
  var headers = s3Utils.getHeadersFromResponse( response );
  
  s3Utils.client.putStream(response, s3Path, headers,
    function(s3Err, s3Response) {
      if ( s3Err ) {
        callback( winston.makeS3Error( s3Err ) );
      } else {
        callback();
      }
    }
  );
}

exports.putBuffer = function(buffer, s3Path, headers, useGzip, callback) {

  if ( ! buffer ) { callback( winston.makeMissingParamError('buffer') ); return; }
  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }
  if ( ! headers ) { callback( winston.makeMissingParamError('headers') ); return; }

  if ( useGzip ) {
    headers['Content-Encoding'] = 'gzip';
    zlib.gzip(buffer, function(err, gzipBuffer) {
      s3Utils.client.putBuffer(gzipBuffer, s3Path, headers,
        function(err, res) {
          if ( err ) {
            callback( winston.makeS3Error(err) );
          } else {
            callback();
          }
        }
      );
    });
  } else {
    s3Utils.client.putBuffer(buffer, s3Path, headers,
      function(err, res) {
        if ( err ) {
          callback( winston.makeS3Error(err) );
        } else {
          callback();
        }
      }
    );
  }
}

exports.getFile = function(s3Path, useGzip, callback) {

  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }

  s3Utils.client.getFile(s3Path, function(err, res) {
    if ( err ) {
      callback( winston.makeS3Error(err) );
    } else {
      if ( useGzip ) {
        var gunzip = zlib.createGunzip();
        res.pipe(gunzip);
        callback(null, gunzip);
      } else {
        callback(null, res);
      }
    }
  });
}