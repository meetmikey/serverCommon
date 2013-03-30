var serverCommon = process.env.SERVER_COMMON;

var winston = require(serverCommon + '/lib/winstonWrapper').winston

winston.doError('error test');
winston.doInfo('info test');
winston.doWarn('warn test');