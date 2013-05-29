var serverCommon = process.env.SERVER_COMMON;

var azureUtils = require ('../lib/azureUtils')
    , winston = require (serverCommon + '/lib/winstonWrapper').winston
    , fs = require ('fs');

var files = [
  'rawEmail/517632d9ed24cce45f000009/3562-body.txt',
  'rawEmail/5175c626c072f6897000000a/9-body.txt',
  'rawEmail/517632d9ed24cce45f000009/3404-body.txt',
  'rawEmail/517632d9ed24cce45f000019/3404-body.txt'
];

files.forEach (function (file) {

  azureUtils.getFile (file, false, function (err, res) {
    var buffer = '';

    if (err) {
      winston.handleError (err);
      return;
    }

    winston.doInfo('getfile register event listeners', {res: res});

//    if (!res.properties.blobType) {
//      azureUtils.printAzureResponse (res);
//    }

    res.on('data', function (chunk) {
      winston.doInfo('data event', {bufferLength: buffer.length});
      buffer += chunk.toString ('binary');
    });

    res.on('end', function () {
      winston.doInfo('bufferLength', {bufferLength: buffer.length});
    });

  });

});

