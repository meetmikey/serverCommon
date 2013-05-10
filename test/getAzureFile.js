var azureUtils = require ('../lib/azureUtils')
    , fs = require ('fs');

var file = process.argv[2];

azureUtils.getFile (file, false, function (err, res) {
  var buffer = '';

  console.log ('getfile register event listeners');

  res.on('data', function (chunk) {
    buffer += chunk.toString ('binary');
    console.log (buffer.length);
  });

  res.on('finished', function () {
    console.log (buffer.length);
    fs.writeFile ('myfile', buffer, 'binary')
  });

  /*
  res.on ('end', function() {
    fs.writeFile ('outfile', buffer, 'binary')
  });*/
});

