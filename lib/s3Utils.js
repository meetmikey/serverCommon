var knox = require('knox')
  , conf = require('../conf')
  , request = require('request')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
  , urlUtils = require('./urlUtils')
  , winston = require('./winstonWrapper').winston
  , zlib = require('zlib');

var s3Utils = this;

exports.DEFAULT_EXPIRES_MINUTES = 30;

exports.client = knox.createClient({
   key: conf.aws.key
  , secret: conf.aws.secret
  , bucket: conf.aws.bucket
})

exports.signedURL = function(s3Path, expiresMinutesInput, model) {
  winston.info ('signedURL', s3Path);
  var expiresMinutes = s3Utils.DEFAULT_EXPIRES_MINUTES;
  if ( expiresMinutesInput ) {
    expiresMinutes = expiresMinutesInput;
  }

  headers = {};

  // TODO: adjust headers
//  if ( headersInput ) {
//    headers = headersInput;
//  }

  var expires = new Date();
  expires.setMinutes(expires.getMinutes() + expiresMinutes);
  var signedURL = s3Utils.client.signedUrl(s3Path, expires, headers);
  return signedURL;
}

exports.getAttachmentS3Path = function(attachment) {
  
  if ( ! attachment ) {
    winston.warn('s3Utils: getAttachmentS3Path: no attachment');
    return '';
  }
  if ( ! attachment.hash ) {
    winston.warn('s3Utils: getAttachmentS3Path: no attachment hash');
    return '';
  }
  if ( ! attachment.fileSize ) {
    winston.warn('s3Utils: getAttachmentS3Path: no attachment fileSize');
  }

  var s3Id = attachment.hash + '_' + attachment.fileSize;

  var s3Path = conf.aws.s3Folders.attachment + '/' + s3Id;
  return s3Path;
}

exports.getLinkInfoS3Path = function(linkInfo) {
  
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

exports.putBuffer = function(buffer, s3Path, headers, useGzip, attempts, callback) {

  if ( ! buffer ) { callback( winston.makeMissingParamError('buffer') ); return; }
  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }
  if ( ! headers ) { callback( winston.makeMissingParamError('headers') ); return; }

  if ( useGzip ) {
    headers['Content-Encoding'] = 'gzip';
    zlib.gzip(buffer, function(err, gzipBuffer) {
      s3Utils.client.putBuffer(gzipBuffer, s3Path, headers,
        function(err, res) {
          if ( err ) {
            retry(err);
          } 
          else if (res.statusCode !== 200) {
            winston.doWarn ('non 200 status code', {'statusCode' : res.statusCode, 's3Path' : s3Path});
            retry('Error: non 200 status code for upload: '  + res.statusCode);
          }
          else {
            callback();
          }
        });
    });
  } else {
    s3Utils.client.putBuffer(buffer, s3Path, headers,
      function(err, res) {
        if ( err ) {
          retry();
        }
        else if (res.statusCode !== 200) {
          winston.doWarn ('non 200 status code', {'statusCode' : res.statusCode, 's3Path' : s3Path});
          retry('Error: non 200 status code for upload: '  + res.statusCode);
        }
        else {
          callback();
        }
      });
  }

  function retry (err) {
    if (attempts < constants.S3_RETRIES) {
      winston.info ('Retrying upload for file: ' + s3Path);
      s3Utils.putBuffer (buffer, s3Path, headers, useGzip, attempts + 1, callback);
    }
    else {
      winston.doError ('Max upload attempts exceeded for file', {'intended s3Path' : s3Path});
      
      // write the buffer to disk
      fs.writeFile (constants.ERROR_UPLOADS_DIR + '/' + s3Path, buffer, 'binary', function (err) {
        if (err) {
          winston.doError ('Error saving buffer to disk', {err : err, s3Path : s3Path});
        }
      });
      
      callback( winston.makeS3Error(err) );
    }
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