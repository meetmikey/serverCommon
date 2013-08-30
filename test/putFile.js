var serverCommon = process.env.SERVER_COMMON;

var fs = require ('fs')
  , s3Utils = require ('../lib/s3Utils')
  , azureUtils = require ('../lib/azureUtils')
  , winston = require (serverCommon + '/lib/winstonWrapper').winston


var buf = fs.readFileSync ('./test/data/hyperloop-alpha.pdf');

/*
s3Utils.putBuffer (buf, '/test/fist.png', {}, function (err) {
  if (err) {
    winston.doError ('err')
  }

  winston.doInfo('done');
})*/

//function(buffer, azurePath, options, useGzip, callback)
azureUtils.putBuffer (buf, '/test/hyperloop.pdf', {}, false, function (err) {
  console.log ('result', err)
})