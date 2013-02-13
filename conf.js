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
      , static: '/static'
    }
  }
  , mongo: {
    local: {
      host: 'localhost',
      db: 'mikeyDB',
      user: 'mikey',
      port: 27017,
    },
    mongohqLocal : {
      host : 'linus.mongohq.com',
      db: 'mikeyDBLocal',
      user: 'mikey',
      pass: 'delospass',
      port: 10025
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
  , elasticSearch: {
      host: 'localhost'
    , port: 9200
    , indexName: 'mail'
    , mappingConfigs: [
      {
          mappingName: 'attachment'
        , configFile: 'config/elasticSearch/attachmentMapping.json'
      }
    ]
  }
}