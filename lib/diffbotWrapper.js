var Diffbot = require('diffbot').Diffbot
  , conf = require('../conf')

var diffbot = new Diffbot(conf.diffbot.token);
exports.diffbot = diffbot;