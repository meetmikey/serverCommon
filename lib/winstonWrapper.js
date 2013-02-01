var winston = require ('winston')

//default options... expand later
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {timestamp: true});

exports.winston = winston