var serverCommon = process.env.SERVER_COMMON;
var azureUtils = require (serverCommon + '/lib/azureUtils')
    , http = require ('http')
    , conf = require (serverCommon + '/conf');

var url = 'http://1800hocking.files.wordpress.com/2011/07/hi-ohio-logo.jpg';

cloudStorageUtils.downloadAndSaveStaticImage( url, true, function (err, path) {
  if (err) {
    console.error ('test failed', err);
    return;
  }

  console.log ('path', path);
});


/*
var blobService = azure.createBlobService(conf.azure.storageAccount, conf.azure.storageAccessKey);


 http.get( 'http://1800hocking.files.wordpress.com/2011/07/hi-ohio-logo.jpg', function( response ) {
    var contentLength = Number(response.headers['content-length']);

    blobService.createBlockBlobFromStream (conf.azure.container, 'myImage', response, contentLength, function (err) {
      console.log (err);

    })
  }).on( 'error', function( err ) {
    console.error (err);
  });


*/
