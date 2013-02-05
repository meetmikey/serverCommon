/*
 * Keep all external api tokens, location of keys/crts here
 *
 */

var environment = process.env.NODE_ENV
var base = process.env.MAGIC_SERVER_BASE

var domain = 'local.meetmikey.com';
var awsBucket = 'mikeymaillocal';
var sqsMailDownloadQueue = 'mailDownloadLocal';
var sqsMailReadingQueue = 'mailReaderLocal';

if (environment == 'production') {
  domain = 'www.meetmikey.com';
  awsBucket = 'mikeymail';
  sqsMailDownloadQueue = 'mailDownload'
  sqsMailReadingQueue = 'mailReader'
} else if (environment == 'development') {
  domain = 'dev.meetmikey.com';
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
    , s3Folders: {
      attachments: '/attachments'
    }
  }
  , mongo: {
    local: {
      host: 'localhost',
      db: 'mikeyDB',
      user: 'mikey',
      port: 27017,
    },
    prod: {
      host: 'linus.mongohq.com',
      db: 'mikeyDB_prod',
      user: 'mikey',
      pass: 'delos123pass',
      port: 10027,
    },
    prod_repl: {
      hosts: ['ip-10-70-78-218.ec2.internal', 'ip-10-191-77-128.ec2.internal', 'domU-12-31-39-06-8E-8C.compute-1.internal'],
      db: 'mikeyDB',
      user: 'mikeyprod',
      pass: 'delos33pass',
      ports: [27017, 27017, 27017],
    }
  }
  , express: {
      secret: 'IITYWYBAD4487'
  }
  , google : {
    appId : '1020629660865.apps.googleusercontent.com',
    appSecret : 'pFvM2J42oBnUFD9sI1ZwITFE'
  }
  , domain: domain
}