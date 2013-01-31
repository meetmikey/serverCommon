var winston = require ('winston')

//default options
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {timestamp: true});

exports.winston = winston