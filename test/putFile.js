var serverCommon = process.env.SERVER_COMMON;

var fs = require ('fs')
  , s3Utils = require ('../lib/s3Utils')
  , winston = require (serverCommon + '/lib/winstonWrapper').winston


var buf = fs.readFileSync ('./test/data/fist.png');

s3Utils.putBuffer (buf, '/test/fist.png', {}, function (err) {
  if (err) {
    winston.doError ('err')
  }

  winston.doInfo('done');
})