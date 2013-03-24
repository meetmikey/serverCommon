var azureUtils = require ('../lib/azureUtils')
    , fs = require ('fs');

var file = "rawEmail/514266e16a9290970a000008/196099-body.txt"

azureUtils.getFile (file, false, function (err, res) {
  var buffer = '';

  console.log ('getfile register event listeners');

  if (!res.properties.blobType) {
    azureUtils.printAzureResponse (res);
  }

  res.on('data', function (chunk) {
    buffer += chunk.toString ('binary');
    console.log (buffer.length);
  });

  res.on('end', function () {
    console.log (buffer.length);
    fs.writeFile ('NEW_METHOD', buffer, 'binary')
  });

  /*
  res.on ('end', function() {
    fs.writeFile ('outfile', buffer, 'binary')
  });*/
});

