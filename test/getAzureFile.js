var azureUtils = require ('../lib/azureUtils')
  , fs = require ('fs')
  , winston = require('../lib/winstonWrapper').winston

var file = process.argv[2];

azureUtils.getFile (file, false, function (err, res) {
  var buffer = '';

  winston.doInfo('getfile register event listeners');

  res.on('data', function (chunk) {
    buffer += chunk.toString ('binary');
    winston.doInfo('bufferLength', {bufferLength: bufferLength});
  });

  res.on('finished', function () {
    winston.doInfo('bufferLength', {bufferLength: bufferLength});
    fs.writeFile ('myfile', buffer, 'binary')
  });

  /*
  res.on ('end', function() {
    fs.writeFile ('outfile', buffer, 'binary')
  });*/
});

