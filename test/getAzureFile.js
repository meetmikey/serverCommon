var azureUtils = require ('../lib/azureUtils')
    , fs = require ('fs');

azureUtils.getFile ('blobzip', true, function (err, res) {
  var buffer = '';

  console.log ('getfile register event listeners');

  res.on('data', function (chunk) {
    buffer += chunk.toString ('binary');
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

/*
azureUtils.getFile2 ('blobzip')
*/

azureUtils.getFileBlueSky ('blobzip', true, function (err, res) {
  var buffer = '';

  console.log ('getfile register event listeners');

  res.on('data', function (chunk) {
    buffer += chunk.toString ('binary');
  });

  res.on('end', function () {
    console.log (buffer.length);
    fs.writeFile ('BLUE_SKY', buffer, 'binary')
  });

});