var serverCommon = process.env.SERVER_COMMON;
var azureUtils = require (serverCommon + '/lib/azureUtils')
    , http = require ('http')
    , conf = require (serverCommon + '/conf')
    , winston = require(serverCommon + '/lib/winstonWrapper').winston

var url = 'http://1800hocking.files.wordpress.com/2011/07/hi-ohio-logo.jpg';

cloudStorageUtils.downloadAndSaveImage( url, true, function (err, path) {
  if (err) {
    winston.doError('test failed', {err: err});
    return;
  }
  winston.doInfo('path', {path: path});
});


/*
var blobService = azure.createBlobService(conf.azure.storageAccount, conf.azure.storageAccessKey);


 http.get( 'http://1800hocking.files.wordpress.com/2011/07/hi-ohio-logo.jpg', function( response ) {
    var contentLength = Number(response.headers['content-length']);

    blobService.createBlockBlobFromStream (conf.azure.container, 'myImage', response, contentLength, function (err) {
      if ( err ) {
        winston.doError('error', {err: err});
      }
    })
  }).on( 'error', function( err ) {
    winston.doError('error', {err: err});
  });


*/
