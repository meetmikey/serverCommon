var conf = require('../conf')
  , request = require('request')
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
  , constants = require ('../constants')
  , urlUtils = require('./urlUtils')
  , winston = require('./winstonWrapper').winston
  , zlib = require('zlib')
  , azure = require ('azure')
  , blueSkyService = require ('bluesky').storage({account: conf.azure.storageAccount, key: conf.azure.storageAccessKey});

var blobService = azure.createBlobService(conf.azure.storageAccount, conf.azure.storageAccessKey);
var azureUtils = this;
var blueSkyContainer = blueSkyService.container(conf.azure.container);

exports.signedURL = function(azurePath, expiresMinutesInput, model) {

  winston.doError ('Function is a stub, azureUtils.signedURL')

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

  var container = blueSkyService.container(conf.azure.container);
  var put = container.put (azurePath); 
  put.on('close', function() {
    console.log ('upload done')
  });

  put.on('error', function(err) {
    console.log ('upload error', err)
  });

  response.pipe(put);

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

exports.putBuffer = function(buffer, azurePath, options, useGzip, attempts, callback) {
  if ( ! buffer ) { callback( winston.makeMissingParamError('buffer') ); return; }
  if ( ! azurePath ) { callback( winston.makeMissingParamError('azurePath') ); return; }
  if ( ! options ) { callback( winston.makeMissingParamError('options') ); return; }

  if ( useGzip ) {
    zlib.gzip(buffer, function(err, gzipBuffer) {
      options.contentEncoding = 'gzip';
   
      blobService.createBlockBlobFromBuffer (conf.azure.container, azurePath, gzipBuffer, options, 
        function (err, data) {
          if (err) {
            winston.doAzureError ('error uploading blob from buffer', {err : err});
            retry (err);
          }
          // TODO: will azure http errors show up in err state?
          else {
            winston.doInfo ('uploaded file to azure', {container : data.container, 
              blob : data.blob, 
              etag : data.etag, 
              lastModified : data.lastModified, 
              contentMD5 : data.contentMD5
            });

            callback ();
          }
        });
    });
  } else {
    blobService.createBlockBlobFromBuffer (conf.azure.container, azurePath, buffer, options, 
      function (err, data) {
        if (err) {
          winston.doAzureError ('error uploading blob from buffer', {err : err});
          retry (err);
        }
        // TODO: will azure http errors show up in err state?
        else {
          winston.doInfo ('uploaded file to azure', {container : data.container, 
            blob : data.blob, 
            etag : data.etag, 
            lastModified : data.lastModified, 
            contentMD5 : data.contentMD5
          });

          callback ();
        }
      });
  }


  function retry (err) {
    if (attempts < constants.S3_RETRIES) {
      winston.info ('Retrying upload for file: ' + azurePath);
      azureUtils.putBuffer (buffer, azurePath, options, useGzip, attempts + 1, callback);
    }
    else {     
      // write the buffer to disk
      fs.writeFile (constants.ERROR_UPLOADS_DIR + '/' + azurePath, buffer, 'binary', function (err) {
        if (err) {
          winston.doError ('Error saving buffer to disk', {err : err, azurePath : azurePath});
        }
      });
      
      callback( winston.makeAzureError('Max upload attempts exceeded for file' , 
        {err : err, 'intendedPath' : azurePath}) );
    }
  }


}

exports.getFile = function(azurePath, useGzip, callback) {
  winston.doInfo ('azureUtils: getFile: ',{azurePath : azurePath});

  if ( ! azurePath ) { callback( winston.makeMissingParamError('azurePath') ); return; }

  blueSkyContainer.get(azurePath, function (err, res) {
    if (err) {
      callback (winston.makeAzureError ('Error getting file', {azurePath :azurePath, err : err}) );
      return;
    }

    if ( useGzip ) {
      var gunzip = zlib.createGunzip();
      res.pipe(gunzip);
      callback(null, gunzip);
    } else {
      callback(null, res);
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