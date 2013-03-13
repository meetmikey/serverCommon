var mailUtils = require ('../lib/mailUtils');



var hdrs = {to : '"Bradfield, David" <david.bradfield@fleishman.ca>, Cheesan Chew <cchew@ideacouture.com>, Andrew Lockhart <alockhart@ideacouture.com>'}

console.log (mailUtils.normalizeAddressArrays(hdrs))