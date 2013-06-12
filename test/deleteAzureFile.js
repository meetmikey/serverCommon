var serverCommon = process.env.SERVER_COMMON;

var cloudStorageUtils = require (serverCommon + '/lib/cloudStorageUtils'),
    fs = require ('fs');

var filePath = './test/data/craigslist.html';

var buffer = fs.readFileSync (filePath);

cloudStorageUtils.putBuffer (buffer, 'testFile', {}, false, true, function (err) {
  if (err) {
    console.error ('could not putBuffer', err);
  } else {
    cloudStorageUtils.deleteFile ('testFile', true, function (err) {
      if (err) {
        console.error ('could not delete file', err);
      } else {
        console.log ('file deleted')
      }
    })
  }
})


