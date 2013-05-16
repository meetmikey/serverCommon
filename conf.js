/*
 * Keep all external api tokens, location of keys/crts here
 *
 */

var environment = process.env.NODE_ENV;
var serverCommon = process.env.SERVER_COMMON;

var winston = require('./lib/winstonWrapper').winston

// set maxsockets
var http = require('http');
var https = require('https');

http.globalAgent.maxSockets = 15;
https.globalAgent.maxSockets = 15;

var domain = 'local.meetmikey.com';

var awsBucket = 'mikeymaillocal';
var awsKey = 'AKIAJENDDHKD34F4QMSA'; //IAM: nonProd
var awsSecret = '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'; //IAM: nonProd

var azureStorageAccount = 'mikeymaillocal';
var azureStorageAccessKey = 'aQHFv+BS2/K920hRjtjrfWggqD1/liGGiKiNWdqfyuN18De7P106Vq/g8KKuz07QNczM+YmRzwVDUshpjcxVaA==';

var elasticSearchHost = 'localhost';
var elasticSearchIsSecure = false;
var elasticSearchPort = 9200;

var cryptoAESSecret = 'M45Iksu09349)(*$(jsdL:KD';

var mongoHQProd = {};
var objectRocketProd = {};

var memcached = {
  host : 'localhost',
  port : 11211
};

var queuePrefix = 'local';
if ( process.env.LOCAL_QUEUE_PREFIX ) {
  queuePrefix = process.env.LOCAL_QUEUE_PREFIX + 'Local';
}

if (environment == 'production') {
  domain = 'api.meetmikey.com';
  elasticSearchHost = 'es.meetmikey.com'
  elasticSearchIsSecure = true;
  elasticSearchPort = 9201;
  awsBucket = 'mikeymail';
  queuePrefix = 'prod';
  var secureConf = require('./secureConf');
  //AppInitUtils does this same check, but let's just be sure.
  if ( ( ! secureConf ) || (typeof secureConf === 'undefined') ) {
    winston.doError('no secureConf file... exiting now');
    process.exit(1);
  }
  awsKey = secureConf.aws.key;
  awsSecret = secureConf.aws.secret;
  azureStorageAccount = secureConf.azure.storageAccount
  azureStorageAccessKey = secureConf.azure.storageAccessKey
  cryptoAESSecret = secureConf.crypto.aesSecret;
  mongoHQProd = secureConf.mongo.mongoHQProd;
  memcached.host = 'mikeycache.5rt4mb.0001.use1.cache.amazonaws.com';

} else if (environment == 'development') {
  domain = 'dev.meetmikey.com';
  awsBucket = 'mikeymaildev';
  queuePrefix = 'dev';
}

var sqsMailDownloadQueue = queuePrefix + 'MailDownload';
var sqsMailReadingQueue = queuePrefix + 'MailReader';
var sqsMailReadingQuickQueue = queuePrefix + 'MailReaderQuick';
var sqsMailActiveConnectionQueue = queuePrefix + 'MailActiveConnection';
var sqsWorkerQueue = queuePrefix + 'Worker';
var sqsWorkerReindexQueue = queuePrefix + 'WorkerReindex';
var sqsCacheInvalidationQueue = queuePrefix + 'CacheInvalidation';

module.exports = {
  aws : {
      key: awsKey
    , secret: awsSecret
    , bucket: awsBucket
    , accountID: '315865265008'
    , sqsMailReadingQueue: sqsMailReadingQueue
    , sqsMailReadingQuickQueue : sqsMailReadingQuickQueue
    , sqsMailDownloadQueue : sqsMailDownloadQueue
    , sqsMailActiveConnectionQueue : sqsMailActiveConnectionQueue
    , sqsWorkerQueue : sqsWorkerQueue
    , sqsWorkerReindexQueue : sqsWorkerReindexQueue
    , sqsCacheInvalidationQueue : sqsCacheInvalidationQueue
    , s3Folders: {
        attachment: 'attachment'
      , static: 'images'
      , linkInfo: 'linkInfo'
      , mailBody : 'mailBody'
      , rawEmail : 'rawEmail'
    }
  }
  , azure : {
      storageAccount : azureStorageAccount,
      storageAccessKey : azureStorageAccessKey,
      container : environment,
      blobFolders: {
          attachment: 'attachment'
        , static: 'images'
        , linkInfo: 'linkInfo'
        , mailBody : 'mailBody'
        , rawEmail : 'rawEmail'
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
    , objectRocketProd : objectRocketProd
    , mongoHQProd : mongoHQProd
  }
  , crypto : {
      aesSecret : cryptoAESSecret
    , scheme : 'aes256'
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
      host: elasticSearchHost
    , port: elasticSearchPort
    , useSSL: elasticSearchIsSecure
    , indexName: 'v3'
    , indexAlias : 'v3'
    , mappingConfigs: [
      {
          mappingName: 'document'
        , configFile: serverCommon + '/config/elasticSearch/document.json'
      }
    ]
  }
  , logDir: '/var/log/mikey'
  , diffbot : {
      token : 'b45dc70b4a560b2b106a136212486c0e'
  }
  , googleDriveAPIFileGetPrefix: 'https://www.googleapis.com/drive/v2/files/'
  , validTopLevelDomainsFile: serverCommon + '/data/validTopLevelDomains.txt'
  , memcached : memcached
}
