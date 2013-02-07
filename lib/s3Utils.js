var knox = require('knox')
  , conf = require('../conf')
  , crypto = require('crypto')
  , request = require('request')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
  , urlUtils = require('./urlUtils')
  , winston = require('./winstonWrapper').winston

var s3Utils = this;

exports.DEFAULT_EXPIRES_MINUTES = 30;

exports.client = knox.createClient({
   key: conf.aws.key
  , secret: conf.aws.secret
  , bucket: conf.aws.bucket
})

exports.signedURL = function(s3Path, expiresMinutesInput) {

  var expiresMinutes = s3Utils.DEFAULT_EXPIRES_MINUTES;
  if ( expiresMinutesInput ) {
    expiresMinutes = expiresMinutesInput;
  }

  var expires = new Date();
  expires.setMinutes(expires.getMinutes() + expiresMinutes);
  var signedURL = s3Utils.client.signedUrl(s3Path, expires);
  return signedURL;
}

exports.hashURL = function(url) {
  var md5sum = crypto.createHash('md5');
  md5sum.update( url );
  var hash = md5sum.digest('hex');
  return hash;
}

exports.getStaticS3PathFromImageURL = function(url) {
  var hash = s3Utils.hashURL(url);
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
