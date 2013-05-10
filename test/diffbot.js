var diffbot = require('../lib/diffbotWrapper').diffbot;

var url = "https://github.com/JomuMist/VacationRentals/commit/a5d0a77db82c5e5e3b9d3e94f7ebf3de95331af4";

var diffbotData = {
  uri: url
  , summary: true
  , tags: false
  , stats: true
}

diffbot.article( diffbotData, function(err, response) {

if ( err || ( ! response ) || ( response.errorCode ) ) {
  var warnData = {err: err, response: response, url: url};
  if ( response ) {
    warnData['responseErrorCode'] = response.errorCode;
  }
  console.log ('linkHandler: followDiffbotLink: diffbot failed', warnData);
  console.log (response)

  console.log ('404', response && response.errorCode == 404 || response.errorCode == "404");


    // TODO: check why there was a failure before following directly
  }
  else {
    console.log (response)

  }
});