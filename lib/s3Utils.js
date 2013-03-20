var knox = require('knox')
  , conf = require('../conf')
  , request = require('request')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
  , constants = require ('../constants')
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

  var headers;

  // note passing empty dictionary to knox client causes errors
  if (model.hash) {

    headers = {};

    if (model.isImage || model.docType == 'image' || model.docType == 'pdf') {
      headers['response-content-disposition'] = 'inline; filename=' + model.filename;
    }
    else {
      headers['response-content-disposition'] = 'attachment; filename=' + model.filename;
    }

  }

  var expires = new Date();
  expires.setMinutes(expires.getMinutes() + expiresMinutes);
  var signedURL = s3Utils.client.signedUrl(s3Path, expires, headers);
  return signedURL;
}

exports.getMailBodyPath = function( mail ) {
  if ( ! mail ) {
    winston.warn('s3Utils: getMailBodyPath: no mail');
    return '';
  }
  var mailId = mail._id
  if ( ! mailId ) {
    winston.warn('s3Utils: getMailBodyPath: no mailId');
    return '';
  }

  return conf.aws.s3Folders.mailBody + '/' + mailId;
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

  //TODO: retry mechanism
  
  s3Utils.client.putStream(response, s3Path, headers,
    function(s3Err, s3Response) {
      if ( s3Err ) {
        callback( winston.makeS3Error( s3Err ) );
      } 
      else if (s3Response.statusCode !== 200) {
        winston.doError ('putStream non 200 status code', {'statusCode' : s3Response.statusCode, 's3Path' : s3Path});
        // log the response from aws
        s3Utils.printAWSResponse (s3Response);
      }
      else {
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
    zlib.gzip(buffer, function(zlibError, gzipBuffer) {

      if (zlibError) {
        callback (winston.makeError ('Could not zip buffer', {intendeds3Path : s3Path}));
        return;
      }

      var startTime = Date.now();
      winston.doInfo('ABOUT TO PUT BUFFER', {s3Path: s3Path, size: buffer.length});

      s3Utils.client.putBuffer(gzipBuffer, s3Path, headers,
        function(err, res) {
          if ( err ) {
            winston.doWarn ('Error attempting upload to s3', {err : err});
            retry(err);
          } 
          else if (res && res.statusCode !== 200) {
            s3Utils.printAWSResponse (res);
            winston.doWarn ('non 200 status code', {'statusCode' : res.statusCode, 's3Path' : s3Path});
            retry('Error: non 200 status code for upload: '  + res.statusCode);
          }
          else {

            var elapsedTime = Date.now() - startTime;
            var metric = 'bad';
            if ( elapsedTime ) {
              metric = buffer.length / elapsedTime;
            }
            winston.doInfo('COMPLETED PUT BUFFER', {s3Path: s3Path, size: buffer.length, elapsedTime: elapsedTime, metric: metric});

            callback();
          }
        });
    });
  } else {

    var startTime = Date.now();
    winston.doInfo('ABOUT TO PUT BUFFER, not gzipped', {s3Path: s3Path, size: buffer.length});

    s3Utils.client.putBuffer(buffer, s3Path, headers,
      function(err, res) {
        if ( err ) {
          winston.doWarn ('Error attempting upload to s3', {err : err});
          retry(err);
        }
        else if (res && res.statusCode !== 200) {
          s3Utils.printAWSResponse (res);
          winston.doWarn ('non 200 status code', {'statusCode' : res.statusCode, 's3Path' : s3Path});
          retry('Error: non 200 status code for upload: '  + res.statusCode);
        }
        else {

          var elapsedTime = Date.now() - startTime;
          var metric = 'bad';
          if ( elapsedTime ) {
            metric = buffer.length / elapsedTime;
          }
          winston.doInfo('COMPLETED PUT BUFFER, not gzipped', {s3Path: s3Path, size: buffer.length, elapsedTime: elapsedTime, metric: metric});

          callback();
        }
      });
  }

  var retry = function (err) {

    winston.doInfo('retry called', {s3Path: s3Path, attempts: attempts});

    if (attempts < constants.S3_RETRIES) {
      winston.info ('Retrying upload for file: ' + s3Path);
      s3Utils.putBuffer (buffer, s3Path, headers, useGzip, attempts + 1, callback);
    }
    else {
      // write the buffer to disk
      fs.writeFile (constants.ERROR_UPLOADS_DIR + s3Path, buffer, 'binary', function (err) {
        if (err) {
          winston.doError ('Error saving buffer to disk', {err : err, s3Path : s3Path});
        }
      });
      
      callback( winston.makeS3Error('Max upload attempts exceeded for file' , 
        {err : err, 'intendedPath' : s3Path}) );

    }
  }

}

exports.getFile = function(s3Path, useGzip, callback) {
  winston.doInfo ('s3Utils: getFile: ',{s3Path : s3Path});

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

exports.deleteFile = function(s3Path, callback) {
  winston.doInfo ('s3Utils: deleteFile: ',{s3Path : s3Path});

  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }

  s3Utils.client.deleteFile(s3Path, function(err, res) {
    if ( err ) {
      callback( winston.makeS3Error(err) );

    } else {
      callback();
    }
  });
}

exports.printAWSResponse = function (res) {
  res.setEncoding ('utf8');

  console.error('HEADERS: ' + JSON.stringify(res.headers));
  res.on('data', function (chunk) {
    console.error('BODY: ' + chunk);
  });

}