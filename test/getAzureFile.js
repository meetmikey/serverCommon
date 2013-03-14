var azureUtils = require ('../lib/azureUtils')
    , fs = require ('fs');

var file = "rawEmail/513d1d5ec7e0c441280000sdf05/11-body.txt"

azureUtils.getFile (file, false, function (err, res) {
  var buffer = '';

  console.log ('getfile register event listeners');

  if (!res.properties.blobType) {
    azureUtils.printAzureResponse (res);
  }

  res.on('data', function (chunk) {
    buffer += chunk.toString ('binary');
  });

  res.on('end', function () {
    console.log (buffer.length);
    console.log (buffer);
    fs.writeFile ('NEW_METHOD', buffer, 'binary')
  });

  /*
  res.on ('end', function() {
    fs.writeFile ('outfile', buffer, 'binary')
  });*/
});

