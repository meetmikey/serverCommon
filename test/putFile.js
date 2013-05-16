var fs = require ('fs'),
    s3Utils = require ('../lib/s3Utils');


var buf = fs.readFileSync ('./test/data/fist.png');

s3Utils.putBuffer (buf, '/test/fist.png', {}, function (err) {
  if (err) {
    winston.doError ('err')
  }

  console.log ('done')
})