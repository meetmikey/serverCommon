/*
 * Keep all external api tokens, location of keys/crts here
 *
 */

var environment = process.env.NODE_ENV
var base = process.env.MAGIC_SERVER_BASE


//local (by default)
var awsBucket = 'mikeymaillocal'

if (environment == 'production') {
  awsBucket = 'mikeymail';
} else if (environment == 'development') {
  awsBucket = 'mikeymaildev'
}

module.exports = {
  aws : {
      key: 'AKIAJL2PLJ3JSVHBZD5Q' 
    , secret: '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'
    , bucket: awsBucket
    , accountID: '315865265008'
    , sqsMailReadingQueue: 'mailReader'
    , sqsMailDownloadQueue : 'mailDownload'
  }
}
