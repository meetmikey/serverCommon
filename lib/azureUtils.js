var conf = require('../conf')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
  , constants = require ('../constants')
  , urlUtils = require('./urlUtils')
  , winston = require('./winstonWrapper').winston
  , zlib = require('zlib')
  , azure = require ('azure')
  , BufferedStream = require ('bufferedstream');

var blobService = azure.createBlobService(conf.azure.storageAccount, conf.azure.storageAccessKey);
var azureUtils = this;

exports.signedURL = function(azurePath, expiresMinutesInput, model) {

  winston.doError ('Function is a stub, azureUtils.signedURL')

}

exports.getMailBodyPath = function( mail ) {
  if ( ! mail ) {
    winston.doWarn('azureUtils: getMailBodyPath: no mail');
    return '';
  }
  var mailId = mail._id
  if ( ! mailId ) {
    winston.doWarn('azureUtils: getMailBodyPath: no mailId');
    return '';
  }

  var azurePath = conf.azure.blobFolders.mailBody + '/' + mailId;
  return azurePath;
}

exports.getLinkInfoAzurePath = function(linkInfo) {
  
  if ( ! linkInfo ) {
    winston.doWarn('azureUtils: getLinkInfoazurePath: no linkInfo');
    return '';
  }
  if ( ! linkInfo.comparableURLHash ) {
    winston.doWarn('azureUtils: getLinkInfoazurePath: no linkInfo comparableURLHash');
    return '';
  }

  var azurePath = conf.azure.blobFolders.linkInfo + '/' + linkInfo.comparableURLHash;
  return azurePath;
}

exports.getImageCloudPathFromURL = function( url ) {
  if ( ! url ) { winston.doWarn('azureUtils: getImageCloudPathFromURL: no url'); }
  var hash = urlUtils.hashURL(url);
  var azurePath = conf.azure.blobFolders.images + '/' + hash;
  return azurePath;
}

exports.getUploadHeadersFromResponse = function( response ) {

  var headers = {};

  if ( ! response ) {
    winston.doError('getUploadHeadersFromResponse: no response!');

  } else {
    headers['contentLength'] = Number( response.headers['content-length'] );
    headers['contentType'] = response.headers['content-type'];
  }
  return headers;
}

exports.putStream = function (stream, cloudPath, headers, useGzip, callback) {
  callback( winston.makeError('azureUtils.putStream method not implemented') );
}

exports.putBuffer = function(buffer, azurePath, options, useGzip, callback) {
  if ( ! buffer ) { callback( winston.makeMissingParamError('buffer') ); return; }
  if ( ! azurePath ) { callback( winston.makeMissingParamError('azurePath') ); return; }
  if ( ! options ) { callback( winston.makeMissingParamError('options') ); return; }
  winston.doInfo ('begin putBuffer', {path : azurePath});
  var cbCalled = false;

  if ( useGzip ) {
    zlib.gzip( buffer, function(err, gzipBuffer ) {
      options.contentEncoding = 'gzip';
      azureUtils.putBuffer( gzipBuffer, azurePath, options, false, callback );
    });
  } else {
    options.timeoutIntervalInMs = constants.AZURE_UPLOAD_TIMEOUT;

    setTimeout(function () {
      if (!cbCalled) {
        callback( winston.makeAzureError( 'error azure timeout', {azurePath : azurePath} ) );
        cbCalled = true;
      }
    }, constants.AZURE_UPLOAD_TIMEOUT);

    blobService.createBlockBlobFromBuffer( conf.azure.container, azurePath, buffer, options, 
      function (azureError, data) {
        if (azureError) {
          // TODO: will azure http errors show up in err state?
          callback( winston.makeAzureError( 'error uploading blob from buffer', {azureError : azureError} ) );
          cbCalled = true;

        } else {
          winston.doInfo ('uploaded file to azure', {container : data.container, 
            blob : data.blob, 
            etag : data.etag, 
            lastModified : data.lastModified, 
            contentMD5 : data.contentMD5
          });

          callback();
          cbCalled = true;
        }
      }
    );
  }
}

exports.getFile = function(azurePath, useGzip, callback) {
  //winston.doInfo ('azureUtils: getFile: ',{azurePath : azurePath});

  if ( ! azurePath ) { callback( winston.makeMissingParamError('azurePath') ); return; }

  // TODO: I WANT TO REPLACE ALL OF THIS CODE
  var res = new BufferedStream;

  // optimistic...
  if ( useGzip ) {
    var gunzip = zlib.createGunzip();
    res.pipe(gunzip);
    callback(null, gunzip);
    //I'm not positive about all this.  Azure's kind of a mess.
    azureUtils.checkGetFileResponse( gunzip, callback );
  } else {
    azureUtils.checkGetFileResponse( res, callback );
  }

  res.on ('end', function () {
    res.hasEnded = true;
    if (res.isValid) {
      res.emit ('finished');
    }
  });

  blobService.getBlobToStream (conf.azure.container, azurePath, res, function (err, serverBlob) {
    if (err) {
      res.emit ('error', winston.makeAzureError ('error getting file', {azurePath : azurePath, err : err}));
//      callback ();
    } else if (!serverBlob.blobType === 'BlockBlob') {
      res.emit ('error', winston.makeAzureError ('error getting file', {azurePath : azurePath, blobProperties : serverBlob}));
//      callback (winston.makeAzureError ('error getting file', {azurePath : azurePath, blobProperties : serverBlob}));
    } else {
      res.isValid = true;
      if (res.hasEnded) {
        res.emit ('finished');
      }
    }
  });
}

exports.checkGetFileResponse = function( response, callback ) {

  if ( ! response ) {
    callback( winston.makeError('no response') );

  } else if ( response.properties && ( ! response.properties.blobType ) ) {
    webUtils.getPrintableResponseInfo( response, function(err, responseInfo) {
      if ( err ) {
        winston.doWarn('azureUtils: checkGetFileResponse: getPrintableResponseInfo err', {err: err});
      }
      callback( winston.makeError('No blobType', {responseInfo: responseInfo}) );
    });

  } else {
    callback( null, response );
  }
}

exports.deleteFile = function (azurePath, callback) {
  blobService.deleteBlob (conf.azure.container, azurePath, function (err, success, response) {
    if (err || !success) {
      callback (winston.makeError ('error delete file', {err : err, success: success, response: response}));
    } else {
      callback ();
    }
  });
}

exports.printAzureResponse = function (res) {
//  res.setEncoding ('utf8');
  var buf = "";

  res.on('data', function (chunk) {
    buf += chunk.toString ('binary');
  });

  res.on ('end', function () {
    winston.doError ('azure response object', {buf : buf});
  });
}