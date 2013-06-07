var followLinkUtils = require ('../lib/followLinkUtils'),
    fs = require ('fs');

var file = './test/data/craigslist.html';

fs.readFile (file, 'utf-8', function (err, contents) {
  if (err) {
    console.error (err);
  } else {
    var summary = followLinkUtils.extractSummaryFromHTML (contents);
    console.log (summary);
  }
});