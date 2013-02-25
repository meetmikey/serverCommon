/*
 * Keep all external api tokens, location of keys/crts here
 *
 */

var environment = process.env.NODE_ENV;
var serverCommon = process.env.SERVER_COMMON;

var domain = 'local.meetmikey.com';
var awsBucket = 'mikeymaillocal';
var sqsMailDownloadQueue = 'mailDownloadLocal';
var sqsMailReadingQueue = 'mailReaderLocal';
var sqsMailReadingQuickQueue = 'mailReaderQuickLocal';
var sqsMailUpdateQueue = 'mailUpdaterLocal';
var sqsMailActiveConnectionQueue = 'mailActiveConnectionLocal';

if (environment == 'production') {
  domain = 'www.meetmikey.com';
  awsBucket = 'mikeymail';
  sqsMailDownloadQueue = 'mailDownload';
  sqsMailReadingQueue = 'mailReader';
  sqsMailUpdateQueue = 'mailUpdater';
  sqsMailReadingQuickQueue = 'mailReaderQuick';
  sqsMailActiveConnectionQueue = 'mailActiveConnection';
} else if (environment == 'development') {
  domain = 'dev.meetmikey.com';
  awsBucket = 'mikeymaildev';
  sqsMailDownloadQueue = 'mailDownloadDev';
  sqsMailReadingQueue = 'mailReaderDev';
  sqsMailUpdateQueue = 'mailUpdaterDev';
  sqsMailReadingQuickQueue = 'mailReaderQuickDev';
  sqsMailActiveConnectionQueue = 'mailActiveConnectionDev';
}

module.exports = {
  aws : {
      key: 'AKIAJL2PLJ3JSVHBZD5Q' 
    , secret: '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'
    , bucket: awsBucket
    , accountID: '315865265008'
    , sqsMailReadingQueue: sqsMailReadingQueue
    , sqsMailReadingQuickQueue : sqsMailReadingQuickQueue
    , sqsMailDownloadQueue : sqsMailDownloadQueue
    , sqsMailUpdateQueue : sqsMailUpdateQueue
    , sqsMailActiveConnectionQueue : sqsMailActiveConnectionQueue
    , s3Folders: {
        attachment: '/attachment'
      , static: '/static'
      , linkInfo: '/linkInfo'
    }
  }
  , mongo: {
      local: {
          host: 'localhost'
        , db: 'mikeyDB'
        , user: 'mikey'
        , port: 27017
      }
    , mongoHQLocal : {
          host : 'linus.mongohq.com'
        , db: 'mikeyDBLocal'
        , user: 'mikey'
        , pass: 'delospass'
        , port: 10025
      }
    , mongoHQDev : {
          host : 'linus.mongohq.com'
        , db: 'mikeyDBDev'
        , user: 'mikey'
        , pass: 'delospass'
        , port: 10096
      }
    , objectRocketDev : {
          host : 'e-mongos0.objectrocket.com'
        , db: 'mikeyDBDev'
        , user: 'mikey'
        , pass: 'delospass'
        , port: 10065
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
          mappingName: 'resource'
        , configFile: serverCommon + '/config/elasticSearch/resourceMapping.json'
      },
      {
          mappingName: 'resourceMeta'
        , configFile: serverCommon + '/config/elasticSearch/resourceMetaMapping.json'
      }
    ]
  }
  , logDir: '/var/log/mikey'
}
