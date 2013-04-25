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

    console.log ('getfile register event listeners', res);

//    if (!res.properties.blobType) {
//      azureUtils.printAzureResponse (res);
//    }

    res.on('data', function (chunk) {
      console.log ('data event');
      buffer += chunk.toString ('binary');
      console.log (buffer.length);
    });

    res.on('end', function () {
      console.log (buffer.length);
    });

  });

});

