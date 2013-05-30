var serverCommon = process.env.SERVER_COMMON;

var request = require('request')
  , webUtils = require(serverCommon + '/lib/webUtils')
  , winston = require(serverCommon + '/lib/winstonWrapper').winston


//var url = 'http://d8u1nmttd4enu.cloudfront.net/designs/stanford-startup-incubator-logo-logo-design-99designs_3765884~05a65cb4ddc74caf996597c6972b99a1e33d24d7_largecrop';
//var url = 'http://imagec10.247realmedia.com/RealMedia/ads/Creatives/crain/ANO_OZ_JMA_RSTL_0413/JMA-Husky-Leaderboardrev.jpg';
//var url = 'https://smartguysbuildingcoolstuff.com';
//var url = 'http://online.citibank.com/GFC/branding/img/citilogo_branding_60x35.png';
var url = 'http://bit.ly/VoKjP8';
var url = 'http://www.wired.com/images_blogs/rawfile/2013/04/manofwar400x200.jpg';

var COUNT = 1;
for ( var i=0; i<COUNT; i++ ) {

  webUtils.webGet( url, true, function(err, responseBuffer, url, headers) {
    if ( err ) {
      winston.handleError(err);

    } else {
      var s = responseBuffer.toString();
      winston.doInfo('success!', {url: url, headers: headers});
    }
  });
}