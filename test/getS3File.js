var serverCommon = process.env.SERVER_COMMON;

var s3Utils = require(serverCommon + '/lib/s3Utils')
  , fs = require('fs')
  , winston = require(serverCommon + '/lib/winstonWrapper').winston
  util = require(serverCommon + '/lib/utils')

var file = process.argv[2];
winston.doInfo('file: ', {file: file});

s3Utils.getFile (file, false, function (err, res) {

  if ( err ) {
    winston.handleError(err);

  } else if ( ! res ) {
    winston.doError('no response!');

  } else {
    utils.streamToBuffer( res, function(err, buffer) {
      if ( err ) {
        winston.handleError(err);

      } else if ( ! buffer ) {
        winston.doError('no buffer!')

      } else {
        fs.writeFile('outfile', buffer, 'binary');
        winston.doInfo('done!');
      }
    });
  }
});

