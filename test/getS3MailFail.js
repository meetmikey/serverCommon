var serverCommon = process.env.SERVER_COMMON;

var mongoose = require (serverCommon + '/lib/mongooseConnect').mongoose
  , winston = require (serverCommon + '/lib/winstonWrapper').winston
  , cloudStorageUtils = require ('../lib/cloudStorageUtils')

var msg = {'s3Path' : 'rawEmail/513cd9b6d0f26c9d41000005/305859-body.txt'}

 cloudStorageUtils.getFile( msg.s3Path, false, false, function(err, res) {
    if ( err ) {
      callback( err );
      
    } else if ( ! res) {
      winston.makeMissingParamError('res');

    } else {
      res.on('data', function(data) {
        // data - but data could be something like...
        winston.doInfo('data', {data: data});
      });
      res.on('end', function() {
        winston.doInfo('end');
      });
      res.on('error', function (err) {
        winston.makeError ('Error downloading email from cloud', {err : err});
      });
    }

 })