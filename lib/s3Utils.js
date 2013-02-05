var knox = require('knox')
  , conf = require('../conf')

//hi
exports.client = knox.createClient({
   key: conf.aws.key
  , secret: conf.aws.secret
  , bucket: conf.aws.bucket
})