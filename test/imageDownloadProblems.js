var cloudStorageUtils = require('../lib/cloudStorageUtils')
  , winston = require('../lib/winstonWrapper').winston

var url = 'http://thenextweb.com/wp-content/blogs.dir/1/files/2013/05/ads-730x209.jpg';
url = 'https://www.google.com/images/srpr/logo4w.png';
var useAzure = false;

cloudStorageUtils.downloadAndSaveImage( url, useAzure, function(err) {
  if ( err ) {
    winston.handleError(err);

  } else {
    winston.doInfo('success!');
  }
});