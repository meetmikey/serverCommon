var SERVER_COMMON = process.env.SERVER_COMMON;

var esConnect = require('../lib/esConnect');
var conf = require (SERVER_COMMON + '/conf');
conf.turnDebugModeOn();

esConnect.init(conf, function (err) {
  console.log (err);
})