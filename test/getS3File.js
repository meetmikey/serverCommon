var serverCommon = process.env.SERVER_COMMON;

var s3Utils = require(serverCommon + '/lib/s3Utils')
  , fs = require('fs')
  , winston = require(serverCommon + '/lib/winstonWrapper').winston
  , utils = require(serverCommon + '/lib/utils')
  , constants = require(serverCommon + '/constants')

var file = process.argv[2];
winston.doInfo('file2: ', {file: file});

s3Utils.getFile (file, false, function (err, res) {

  if ( err ) {
    if ( winston.getErrorType( err ) == constants.ERROR_TYPE_404 ) {
      winston.doInfo('404 error!');
    }
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

