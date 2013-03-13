var serverCommon = process.env.SERVER_COMMON;

var mongoose = require (serverCommon + '/lib/mongooseConnect').mongoose;
var winston = require (serverCommon + '/lib/winstonWrapper').winston;
var cloudStorageUtils = require ('../lib/cloudStorageUtils');

var msg = {'s3Path' : 'rawEmail/513cd9b6d0f26c9d41000005/305859-body.txt'}

 cloudStorageUtils.getFile( msg.s3Path, false, false, function(err, res) {
    if ( err ) {
      callback( err );
      
    } else if ( ! res) {
      winston.makeMissingParamError('res');

    } else if (res && res.statusCode != 200) {
      winston.makeError ('Non-200 status code for download and run mail parser'), {statusCode : res.statusCode};
      cloudStorageUtils.printResponse (res, false);
    } else {
      res.on('data', function(data) {
        // data - but data could be something like...
        console.log (data);
      });
      res.on('end', function() {
        console.log ('end');
      });
      res.on('error', function (err) {
        winston.makeError ('Error downloading email from cloud', {err : err});
      });
    }

 })