var knox = require('knox')
  , conf = require('../conf')
  , crypto = require('crypto')
  , request = require('request')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')

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

exports.getURLHash = function(url) {
  var md5sum = crypto.createHash('md5');
  md5sum.update( url );
  var hash = md5sum.digest('hex');
  return hash;
}

exports.getStaticS3PathFromImageURL = function(url) {
  var hash = s3Utils.getURLHash(url);
  var s3Path = conf.aws.s3Folders.static + '/' + hash;
  return s3Path;
}

exports.getTempFilePath = function(url) {
  var hash = s3Utils.getURLHash(url);
  var tempFilePath = '/tmp/s3UtilsTempFile_' + hash;
  return tempFilePath;
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

      if ( isHTTPS ) {
        s3Utils.downloadAndSaveStaticHTTPSImage( resolvedURL, s3Path, callback );
      } else {
        s3Utils.downloadAndSaveStaticHTTPImage( resolvedURL, s3Path, callback );
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

  var request = https.request( options, function( httpsResponse ) {

    var tempFilePath = s3Utils.getTempFilePath( url );
    var file = fs.createWriteStream( tempFilePath );
    
    httpsResponse.on( 'data', function( data ) {
      file.write( data );
    });

    httpsResponse.on( 'end', function () {

      file.end();
      var headers = s3Utils.getHeadersFromResponse( httpsResponse );
      
      s3Utils.client.putFile( tempFilePath, s3Path, headers,
        function( s3Err, res ) {
          if ( s3Err ) {
            callback( winston.makeS3Error( s3Err ) );
          } else {
            callback( null, s3Path );
          }
        }
      );
    })
  });

  request.on( 'error', function( err ) {
    callback( winston.makeError( 'https request error', {err: err} ) );
  });
  
  request.end();
}

exports.downloadAndSaveStaticHTTPImage = function(url, s3Path, callback) {

  http.get( url, function( httpResponse ) {
    var headers = s3Utils.getHeadersFromResponse( httpResponse );
    s3Utils.client.putStream(httpResponse, s3Path, headers,
      function(s3Err, s3Response) {
        if ( s3Err ) {
          callback( winston.makeS3Error( s3Err ) );
        } else {
          callback(null, s3Path);
        }
      }
    );
  })
}
