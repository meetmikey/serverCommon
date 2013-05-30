var knox = require('knox')
  , conf = require('../conf')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
  , constants = require ('../constants')
  , utils = require('./utils')
  , urlUtils = require('./urlUtils')
  , webUtils = require('./webUtils')
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

  var expires = new Date();
  expires.setMinutes(expires.getMinutes() + expiresMinutes);
  var signedURL = s3Utils.client.signedUrl(s3Path, expires, options);
  return signedURL;
}

exports.getMailBodyPath = function( mail ) {
  if ( ! mail ) {
    winston.doWarn('s3Utils: getMailBodyPath: no mail');
    return '';
  }
  var mailId = mail._id
  if ( ! mailId ) {
    winston.doWarn('s3Utils: getMailBodyPath: no mailId');
    return '';
  }

  return conf.aws.s3Folders.mailBody + '/' + mailId;
}

exports.getAttachmentS3Path = function(attachment) {
  
  if ( ! attachment ) {
    winston.doWarn('s3Utils: getAttachmentS3Path: no attachment');
    return '';
  }
  if ( ! attachment.hash ) {
    winston.doWarn('s3Utils: getAttachmentS3Path: no attachment hash');
    return '';
  }
  if ( ! attachment.fileSize ) {
    winston.doWarn('s3Utils: getAttachmentS3Path: no attachment fileSize');
  }

  var s3Id = attachment.hash + '_' + attachment.fileSize;

  var s3Path = conf.aws.s3Folders.attachment + '/' + s3Id;
  return s3Path;
}

exports.getLinkInfoS3Path = function(linkInfo) {
  
  if ( ! linkInfo ) {
    winston.doWarn('s3Utils: getLinkInfoS3Path: no linkInfo');
    return '';
  }
  if ( ! linkInfo.comparableURLHash ) {
    winston.doWarn('s3Utils: getLinkInfoS3Path: no linkInfo comparableURLHash');
    return '';
  }

  var s3Path = conf.aws.s3Folders.linkInfo + '/' + linkInfo.comparableURLHash;
  return s3Path;
}

exports.getImageCloudPathFromURL = function( url ) {
  if ( ! url ) { winston.doWarn('s3Utils: getImageCloudPathFromURL: no url'); }
  var hash = urlUtils.hashURL(url);
  var s3Path = conf.aws.s3Folders.images + '/' + hash;
  return s3Path;
}

exports.getUploadHeadersFromResponse = function( response ) {

  var headers = {};

  if ( ! response ) {
    winston.doMissingParamError('response');
    
  } else {
    headers['Content-Length'] = response.headers['content-length'];
    headers['Content-Type'] = response.headers['content-type'];
  }

  return headers;
}

exports.putStream = function( stream, s3Path, headers, useGzip, callback ) {

  winston.doInfo('putStream...', {s3Path: s3Path, headers: headers, useGzip: useGzip});

  if ( ! stream ) { callback( winston.makeMissingParamError('stream') ); return; }
  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }

  if ( useGzip ) {
    // TODO: support use gzip for streaming uploads...
    callback( winston.makeError('s3Utils: putStream: useGzip not yet supported') );
    return;
  }
 
  var clientPutStreamHasCalledBack = false;
  s3Utils.client.putStream( stream, s3Path, headers, function(s3Err, response) {
    
    if ( clientPutStreamHasCalledBack ) {
      winston.doWarn('Double callback from s3Utils.client.putStream, ignoring', {s3Err: s3Err});

    } else {
      clientPutStreamHasCalledBack = true;
      s3Utils.checkS3Response( s3Err, response, {s3Path: s3Path, 'request': 'putStream'}, function(err) {
        if ( err ) {
          callback( err );

        } else {
          callback();
        }
      });
    }
  });
}

exports.putBuffer = function( buffer, s3Path, headers, useGzip, callback ) {
  if ( ! buffer ) { callback( winston.makeMissingParamError('buffer') ); return; }
  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }
  if ( ! headers ) { callback( winston.makeMissingParamError('headers') ); return; }

  if ( useGzip ) {
     headers['Content-Encoding'] = 'gzip';
     zlib.gzip( buffer, function( zlibError, gzipBuffer ) {
      if ( zlibError ) {
        callback( winston.makeError('Could not zip buffer', {s3Path : s3Path}) );

      } else {
        s3Utils.putBuffer( gzipBuffer, s3Path, headers, false, callback );
      }
    });

  } else {
    var startTime = Date.now();
    
    var clientPutBufferHasCalledBack = false;
    s3Utils.client.putBuffer( buffer, s3Path, headers, function(s3Err, response) {

      if ( clientPutBufferHasCalledBack ) {
        //Here lie 3 days of Justin's time and 2 days of Sagar's.  R.I.P.
        winston.doWarn('Double callback from s3Utils.client.putBuffer, ignoring', {s3Err: s3Err});

      } else {
        clientPutBufferHasCalledBack = true;
        s3Utils.checkS3Response( s3Err, response, {s3Path: s3Path, 'request': 'putBuffer'}, function(err) {
          if ( err ) {
            callback(err);

          } else {
            var elapsedTime = Date.now() - startTime;
            var metric = 'bad';
            if ( elapsedTime ) {
              //metric = buffer.length / elapsedTime;
            }
            //winston.doInfo('completed putBuffer', {s3Path: s3Path, size: buffer.length, elapsedTime: elapsedTime, metric: metric});
            callback();
          }
        });
      }
    });
  }
}

exports.getFile = function(s3Path, useGzip, callback) {
  //winston.doInfo ('s3Utils: getFile: ',{s3Path : s3Path});

  if ( ! s3Path ) { callback( winston.makeMissingParamError('s3Path') ); return; }

  var clientGetFileHasCalledBack = false;
  s3Utils.client.getFile(s3Path, function(s3Err, response) {

    if ( clientGetFileHasCalledBack ) {
      winston.doWarn('Double callback from s3Utils.client.getFile, ignoring', {s3Err: s3Err});

    } else {
      clientGetFileHasCalledBack = true;
      s3Utils.checkS3Response( s3Err, response, {s3Path: s3Path, 'request': 'getFile'}, function(err) {
        if ( err ) {
          callback( err );

        } else {
          if ( useGzip ) {
            var gunzip = zlib.createGunzip();
            response.pipe(gunzip);
            callback(null, gunzip);

          } else {
            callback(null, response);
          }
        }
      });
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

exports.checkFileExists = function (s3Path, callback) {
  if (!s3Path) { callback ( winston.makeMissingParamError ('s3Path') ); return; }

  var knoxHasCalledback = false;

  s3Utils.client.headFile (s3Path, function (err, res) {

    if (knoxHasCalledback) {
      winston.doWarn ('Double callback from s3Utils.client.headFile, ignoring', {err : err});
    } else {
      knoxHasCalledback = true;

      if (err) {
        callback (winston.makeS3Error (err));
      } else if (res && res.statusCode == 200) {
        callback (null, true);
      } else {
        callback (null, false);
      }

    }
  });
}

exports.checkS3Response = function( s3Error, response, logData, callback ) {
  if ( ! utils.isObject( logData ) ) {
    logData = {};
  }
  if ( s3Error ) {
    callback( winston.makeS3Error(s3Error) );

  } else if ( ! response ) {
    callback( winston.makeError('no response', logData) );

  } else if ( ( ! response.statusCode ) || ( response.statusCode !== 200 ) ) {
    webUtils.getPrintableResponseInfo( response, function(err, responseInfo) {
      if ( err ) {
        winston.doWarn('s3Utils: putBuffer: getPrintableResponseInfo error', {err: err});
      }
      logData['statusCode'] = response.statusCode;
      logData['responseInfo'] = responseInfo;
      var winstonError = winston.makeError('non-200 status code', logData);
      if ( response.statusCode.toString() == '404' ) {
        winston.setErrorType( winstonError, constants.ERROR_TYPE_404 );
      }
      callback( winstonError );
    });

  } else {
    callback();
  }
}