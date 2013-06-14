var serverCommon = process.env.SERVER_COMMON;

var winston = require (serverCommon + '/lib/winstonWrapper').winston,
    conf = require (serverCommon + '/conf');

winston.doInfo ('hello world');

conf.turnDebugModeOff();

winston.doInfo ('this wont print');

conf.turnDebugModeOn();

winston.doInfo ('this will print');