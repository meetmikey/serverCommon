var serverCommon = process.env.SERVER_COMMON;

var mongoose = require (serverCommon + '/lib/mongooseConnect').mongoose
  , winston = require (serverCommon + '/lib/winstonWrapper').winston
  , webUtils = require ('../lib/webUtils')

var url = 'https://github.com/JomuMist/VacationRentals/commit/a5d0a77db82c5e5e3b9d3e94f7ebf3de95331af4'

 webUtils.webGet( url, true, function (err, response, url, headers )  {
  winston.doInfo('info', {err: err, response: response, url: url, headers: headers});
 });