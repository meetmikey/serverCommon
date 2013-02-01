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

var awsBucket = 'mikeymaillocal'
var sqsMailDownloadQueue = 'mailDownloadLocal'
var sqsMailReadingQueue = 'mailReaderLocal'

if (environment == 'production') {
  awsBucket = 'mikeymail';
  sqsMailDownloadQueue = 'mailDownload'
  sqsMailReadingQueue = 'mailReader'
} else if (environment == 'development') {
  awsBucket = 'mikeymaildev'
  sqsMailDownloadQueue = 'mailDownloadDev'
  sqsMailReadingQueue = 'mailReaderDev'
}

module.exports = {
  aws : {
      key: 'AKIAJL2PLJ3JSVHBZD5Q' 
    , secret: '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'
    , bucket: awsBucket
    , accountID: '315865265008'
    , sqsMailReadingQueue: sqsMailReadingQueue
    , sqsMailDownloadQueue : sqsMailDownloadQueue
  }
  , mongo: {
    local: {
      host: 'localhost',
      db: 'mikeyDB',
      user: 'mikey',
      port: 27017,
    }
  }
}


