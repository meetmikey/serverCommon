var serverCommon = process.env.SERVER_COMMON;

var mongoose = require (serverCommon + '/lib/mongooseConnect').mongoose
  , winston = require (serverCommon + '/lib/winstonWrapper').winston
  , webUtils = require ('../lib/webUtils')

//var url = 'https://github.com/JomuMist/VacationRentals/commit/a5d0a77db82c5e5e3b9d3e94f7ebf3de95331af4'
//var url = 'http://mailstat.us/tr/t/p2yekqgmbo6rhhifw6i9/3/https://www.vizify.com/es/51633c8f42ba9b000e000412'
var url = 'http://www.espn.go.com'

 webUtils.webGet( url, true, function (err, response, url, headers )  {
  winston.doInfo('info', {err: err, url: url, headers: headers});
 });
