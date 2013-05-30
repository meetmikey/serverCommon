var mailUtils = require ('../lib/mailUtils')
  , winston = require ('../lib/winstonWrapper').winston

var hdrs = {to : '"Bradfield, David" <david.bradfield@fleishman.ca>, Cheesan Chew <cchew@ideacouture.com>, Andrew Lockhart <alockhart@ideacouture.com>'}

var normalizedHeaders = mailUtils.normalizeAddressArrays(hdrs);
winston.doInfo('normalizedHeaders', {normalizedHeaders: normalizedHeaders});