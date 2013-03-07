var conf = require('../conf')
  , request = require('request')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
  , urlUtils = require('./urlUtils')
  , winston = require('./winstonWrapper').winston
  , zlib = require('zlib')
  , azure = require ('azure');

var blobService = azure.createBlobService(conf.azure.storageAccount, conf.azure.storageAccessKey);
var azureUtils = this;

exports.signedURL = function(azurePath, expiresMinutesInput, headersInput) {

  var expiresMinutes = azureUtils.DEFAULT_EXPIRES_MINUTES;
  if ( expiresMinutesInput ) {
    expiresMinutes = expiresMinutesInput;
  }
  headers = {};
  if ( headersInput ) {
    headers = headersInput;
  }

  var expires = new Date();
  expires.setMinutes(expires.getMinutes() + expiresMinutes);
  var signedURL = azureUtils.client.signedUrl(azurePath, expires, headers);
  return signedURL;

}

exports.getAttachmentAzurePath = function(attachment) {
  
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

  var azureId = attachment.hash + '_' + attachment.fileSize;

  var azurePath = conf.azure.blobFolders.attachment + '/' + azureId;
  return azurePath;
}

exports.getMailBodyPath = function( mail ) {
  if ( ! mail ) {
    winston.warn('azureUtils: getMailBodyPath: no mail');
    return '';
  }
  var mailId = mail._id
  if ( ! mailId ) {
    winston.warn('azureUtils: getMailBodyPath: no mailId');
    return '';
  }

  var azurePath = conf.azure.blobFolders.mailBody + '/' + mailId;
  return azurePath;
}

exports.getLinkInfoAzurePath = function(linkInfo) {
  
  if ( ! linkInfo ) {
    winston.warn('azureUtils: getLinkInfoazurePath: no linkInfo');
    return '';
  }
  if ( ! linkInfo.comparableURLHash ) {
    winston.warn('azureUtils: getLinkInfoazurePath: no linkInfo comparableURLHash');
    return '';
  }

  var azurePath = conf.azure.blobFolders.linkInfo + '/' + linkInfo.comparableURLHash;
  return azurePath;
}

exports.getStaticAzurePathFromImageURL = function( url ) {
  if ( ! url ) { winston.warn('azureUtils: getStaticAzurePathFromImageURL: no url'); }
  var hash = urlUtils.hashURL(url);
  var azurePath = conf.azure.blobFolders.static + '/' + hash;
  return azurePath;
}

exports.getOptionsFromResponse = function(response) {
  var options = {
      'contentLength': Number(response.headers['content-length'])
    , 'contentType': response.headers['content-type']
  };
  return options;
}

exports.downloadAndSaveStaticImage = function(url, callback) {

  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  var azurePath = azureUtils.getStaticAzurePathFromImageURL(url);
  
  urlUtils.resolveURL(url,
    function(err, resolvedURL, isHTTPS ) {

      if ( err ) {
        callback(err);

      } else if ( ! resolvedURL ) {
        callback( winston.makeError('no resolved URL') );

      } else {
        var downloadFunction = azureUtils.downloadAndSaveStaticHTTPImage;
        if ( isHTTPS ) {
          downloadFunction = azureUtils.downloadAndSaveStaticHTTPSImage;
        }

        downloadFunction( resolvedURL, azurePath, function(err) {
          if ( err ) {
            callback(err);
          } else {
            callback(null, azurePath);
          }
        });
      }
    }
  );
}

exports.downloadAndSaveStaticHTTPSImage = function(url, azurePath, callback) {

  var parsedURL = urlUtils.parseURL( url );
  var options = {
      host: parsedURL.host
    , port: 443
    , path: parsedURL.path
    , method: 'GET'
  }

  https.get( options, function( response ) {
    azureUtils.uploadResponseToAzure( response, azurePath, callback );

  }).on( 'error', function( err ) {
    callback( winston.makeRequestError( err ) );
  });
}

exports.downloadAndSaveStaticHTTPImage = function(url, azurePath, callback) {
  
  http.get( url, function( response ) {
    azureUtils.uploadResponseToAzure( response, azurePath, callback );

  }).on( 'error', function( err ) {
    callback( winston.makeRequestError( err ) );
  });
}

exports.uploadResponseToAzure = function(response, azurePath, callback) {
  var headers = azureUtils.getOptionsFromResponse( response );
  winston.info('uploadResponseToAzure', azurePath);
  
  azureUtils.putStream(response, azurePath, headers,
    function(azureErr, azureResponse) {
      if ( azureErr ) {
        callback( winston.makeAzureError( azureErr ) );
      } else {
        callback();
      }
    }
  );
}

exports.putStream = function (response, azurePath, options, callback) {
  winston.info('putStream to path', azurePath);
  
  var buffer = '';

  response.setEncoding ('binary');

  response.on('data', function (chunk) {
    buffer += chunk;
  });

  console.log (buffer)

  console.log (options);

  response.on('end', function () {
    fs.writeFile('hello.jpeg', buffer, 'binary')
    azureUtils.putBuffer (new Buffer(buffer, 'binary'), azurePath, {}, false, function (err) {
      if (err) {
        winston.doError ('Error putBuffer', {err : err});
      }
    });
  });

  /*
  // this should work... since response is a readable stream, but it does not!
  console.log ('container', conf.azure.container);
  console.log ('azurePath', azurePath);
  blobService.createBlockBlobFromStream (conf.azure.container, azurePath, response, options['contentLength'], callback)
  */
}

exports.putStreamFromFile = function (azurePath, filename, callback) {
  console.log (conf.azure.container)
  console.log (azurePath)

  blobService.createBlockBlobFromStream (conf.azure.container, azurePath, fs.createReadStream(filename), 198539, function(error){
    if(!error){
        // Blob uploaded
    }
  });
}

exports.putBuffer = function(buffer, azurePath, options, useGzip, callback) {
  if ( ! buffer ) { callback( winston.makeMissingParamError('buffer') ); return; }
  if ( ! azurePath ) { callback( winston.makeMissingParamError('azurePath') ); return; }
  if ( ! options ) { callback( winston.makeMissingParamError('options') ); return; }

  if ( useGzip ) {
    zlib.gzip(buffer, function(err, gzipBuffer) {
      options.contentEncoding = 'gzip';
   
      blobService.createBlockBlobFromBuffer (conf.azure.container, azurePath, gzipBuffer, options, 
        function (err, data) {
          if (err) {
            winston.doError ('error uploading blob from buffer', {err : err});
            callback (err);
          }
          else {
            winston.doInfo ('uploaded file to azure', data);
            callback (null, data);
          }
        });
    });
  } else {
    blobService.createBlockBlobFromBuffer (conf.azure.container, azurePath, buffer, options, 
      function (err, data) {
        if (err) {
          winston.doError ('error uploading blob from buffer', {err : err});
          callback (err);
        }
        else {
          winston.doInfo ('uploaded to azure', data);
          callback (null, data);
        }
      });
  }
}

exports.getFile = function(azurePath, useGzip, callback) {

  if ( ! azurePath ) { callback( winston.makeMissingParamError('azurePath') ); return; }

  azureUtils.client.getFile(azurePath, function(err, res) {
    if ( err ) {
      callback( winston.makeAzureError(err) );
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