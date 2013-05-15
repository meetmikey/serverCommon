var s3Utils = require('../../lib/s3Utils'),
    fs = require ('fs');

describe('existence test', function() {

  it("exists", function() {
    var buffer = fs.readFileSync ('../data/fist.png');

    s3Utils.putBuffer ( buffer, '/test/fist.png', {}, function (err) {
      if (err) {
        winston.doError ('error', {err : err });
      } else {
        s3Utils.checkFileExists ('/test/fist.png', function (err, exists) {
          expect (exists).toBe (true);
        })
      }
    })
  });

  it("does not exist", function() {
    s3Utils.checkFileExists ('/test/helloword.png', function (err, exists) {
      expect (exists).toBe (false);
    })
  });

});