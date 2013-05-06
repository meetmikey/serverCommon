var knox = require('knox')
  , conf = require('../conf')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
  , constants = require ('../constants')
  , utils = require('./utils')
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
  var expiresMinutes = s3Utils.DEFAULT_EXPIRES_MINUTES;
  if ( expiresMinutesInput ) {
    expiresMinutes = expiresMinutesInput;
  }

  var options;

  // note passing empty dictionary to knox client causes errors
  if (model.hash) {

    options = {qs : {}};

    if (model.isImage || model.docType == 'image' || model.docType == 'pdf') {
      options.qs['response-content-disposition'] = 'inline; filename="' + model.filename + "\"";
    }
    else {
      options.qs['response-content-disposition'] = 'attachment; filename="' + model.filename + "\"";
    }

  }

  console.log ('options', options);

  var expires = new Date();
  expires.setMinutes(expires.getMinutes() + expiresMinutes);
  var signedURL = s3Utils.client.signedUrl(s3Path, expires, options);
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

exports.uploadResponse = function( response, s3Path, headers, callback ) {
  s3Utils.uploadResponseAttempt( response, s3Path, headers, 0, callback );
}

exports.uploadResponseAttempt = function( response, s3Path, headers, attempts, callback ) {
  
  if ( ! response ) { callback( winston.makeMissingParamError('response') ); return; }
  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }
 
  var clientPutStreamHasCalledBack = false;
  s3Utils.client.putStream( response, s3Path, headers, function(s3Err, s3Response) {
    
    if ( clientPutStreamHasCalledBack ) {
      winston.doWarn('Double callback from s3Utils.client.putStream, ignoring', {s3Err: s3Err});

    } else {
      clientPutStreamHasCalledBack = true;
      
      if ( s3Err ) {
        var message = 'uploadResponse failed: ' + s3Err.message;
        winston.doWarn( message, {s3Path: s3Path});
        s3Utils.retryUploadResponse( message, response, s3Path, headers, attempts, callback );

      } else if (s3Response.statusCode !== 200) {
        var message = 'putStream non 200 status code:' + s3Response.statusCode;
        winston.doWarn( message, {'statusCode' : s3Response.statusCode, 's3Path' : s3Path} );
        s3Utils.printAWSResponse( s3Response );
        s3Utils.retryUploadResponse( message, response, s3Path, headers, attempts, callback );

      } else {
        callback();
      }
    }
  });
}

exports.getUploadHeadersFromResponse = function( response ) {

  var headers = {};

  if ( ! response ) {
    winston.doError('getUploadHeadersFromResponse: no response!');
    
  } else {
    headers['Content-Length'] = response.headers['content-length'];
    headers['Content-Type'] = response.headers['content-type'];
  }

  return headers;
}


exports.retryUploadResponse = function( errorMessage, response, s3Path, headers, attempts, callback ) {

  if ( attempts < constants.S3_RETRIES ) {
    winston.doInfo('Retrying uploadToS3 for file: ', {s3Path : s3Path, attempts : attempts});
    s3Utils.uploadResponseAttempt( response, s3Path, headers, attempts + 1, callback );

  } else {
    //TODO: convert the stream to a buffer and write to a temp directory on disk?
    callback( winston.makeError('Max upload attempts exceeded for response', {finalErrorMessage: errorMessage, 'intendedPath' : s3Path}) );
  }
}

exports.putStream = function (stream, s3Path, headers, useGzip, callback) {
  // TODO: support use gzip for streaming uploads...
  s3Utils.uploadResponse( stream, s3Path, headers, callback );
}

exports.putGzipBuffer = function( buffer, s3Path, headers, callback ) {

  if ( ! buffer ) { callback( winston.makeMissingParamError('buffer') ); return; }
  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }
  if ( ! headers ) { callback( winston.makeMissingParamError('headers') ); return; }

  headers['Content-Encoding'] = 'gzip';
  zlib.gzip( buffer, function( zlibError, gzipBuffer ) {

    if ( zlibError ) {
      callback( winston.makeError('Could not zip buffer', {s3Path : s3Path}) );

    } else {
      s3Utils.putBuffer( gzipBuffer, s3Path, headers, callback );
    }
  });
}

exports.putBufferAttempt = function( buffer, s3Path, headers, attempts, callback ) {
  if ( ! buffer ) { callback( winston.makeMissingParamError('buffer') ); return; }
  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }
  if ( ! headers ) { callback( winston.makeMissingParamError('headers') ); return; }

  var startTime = Date.now();
  
  var clientPutBufferHasCalledBack = false;
  s3Utils.client.putBuffer( buffer, s3Path, headers, function(s3Err, res) {

    if ( clientPutBufferHasCalledBack ) {
      //Here lie 3 days of Justin's time and 2 days of Sagar's.  R.I.P.
      winston.doWarn('Double callback from s3Utils.client.putBuffer, ignoring', {s3Err: s3Err});

    } else {
      clientPutBufferHasCalledBack = true;

      if ( s3Err ) {
        var message = 'Error attempting upload to s3';
        winston.doWarn(message, {s3Err : s3Err});
        s3Utils.retryPutBuffer( message, buffer, s3Path, headers, attempts, callback );

      } else if ( ( ! res ) || ( ! res.statusCode ) || ( res.statusCode !== 200 ) ) {
        //s3Utils.printAWSResponse( res );
        var statusCode = '(none)';
        if ( res ) {
          statusCode = res.statusCode;
        }
        var warnData = {
            s3Path: s3Path
          , statusCode: statusCode
        };
        var message = 's3Utils: bad response or non-200 statusCode: '  + statusCode;
        winston.doWarn( message, warnData );
        s3Utils.retryPutBuffer( message, buffer, s3Path, headers, attempts, callback );

      } else {
        var elapsedTime = Date.now() - startTime;
        var metric = 'bad';
        if ( elapsedTime ) {
          //metric = buffer.length / elapsedTime;
        }
        //winston.doInfo('completed putBuffer', {s3Path: s3Path, size: buffer.length, elapsedTime: elapsedTime, metric: metric});
        callback();
      }
    }
  });
}

exports.putBuffer = function( buffer, s3Path, headers, callback ) {
  s3Utils.putBufferAttempt( buffer, s3Path, headers, 0, callback );
}

exports.retryPutBuffer = function( errorMessage, buffer, s3Path, headers, attempts, callback ) {

  if ( attempts < constants.S3_RETRIES ) {
    winston.doInfo('Retrying upload for file: ', {s3Path : s3Path, attempts : attempts});
    s3Utils.putBufferAttempt( buffer, s3Path, headers, attempts + 1, callback );

  } else {
    // write the buffer to disk
    fs.writeFile( constants.ERROR_UPLOADS_DIR + s3Path, buffer, 'binary', function( fsErr ) {
      if ( fsErr ) {
        winston.doError ('Error saving buffer to disk', {fsErr : fsErr, s3Path : s3Path});
      }
    });
    
    callback( winston.makeError('Max upload attempts exceeded for file', {finalErrorMessage: errorMessage, 'intendedPath' : s3Path}) );
  }
}

exports.getFile = function(s3Path, useGzip, callback) {
  //winston.doInfo ('s3Utils: getFile: ',{s3Path : s3Path});

  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }

  var clientGetFileHasCalledBack = false;
  s3Utils.client.getFile(s3Path, function(err, res) {

    if ( clientGetFileHasCalledBack ) {
      winston.doWarn('Double callback from s3Utils.client.getFile, ignoring', {err: err});

    } else {
      clientGetFileHasCalledBack = true;
      if ( err ) {
        callback( winston.makeS3Error(err) );
      } else if (res.statusCode && res.statusCode !== 200) {
        callback (winston.makeS3Error ('error getting file', {err : err, type : res.statusCode}));
      } else {
        if ( useGzip ) {
          var gunzip = zlib.createGunzip();
          res.pipe(gunzip);
          callback(null, gunzip);
        } else {
          callback(null, res);
        }
      }
    }
  });
}

exports.deleteFile = function(s3Path, callback) {
  winston.doInfo ('s3Utils: deleteFile: ',{s3Path : s3Path});

  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }

  var clientDeleteFileHasCalledBack = false;
  s3Utils.client.deleteFile(s3Path, function(err, res) {

    if ( clientDeleteFileHasCalledBack ) {
      winston.doWarn('Double callback from s3Utils.client.deleteFile, ignoring', {err: err});

    } else {
      clientDeleteFileHasCalledBack = true;
      if ( err ) {
        callback( winston.makeS3Error(err) );

      } else {
        callback();
      }
    }
  });
}

exports.printAWSResponse = function (res) {
  res.setEncoding ('utf8');

  console.error( 'HEADERS: ' + JSON.stringify( res.headers ) );
  res.on('data', function (chunk) {
    console.error('BODY: ' + chunk);
  });
}