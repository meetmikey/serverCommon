/*
 * Keep all external api tokens, location of keys/crts here
 *
 */

var environment = process.env.NODE_ENV;
var serverCommon = process.env.SERVER_COMMON;

// set maxsockets
var http = require('http');
var https = require('https');

http.globalAgent.maxSockets = 15;
https.globalAgent.maxSockets = 15;

var useNgrok = false;
var domain = 'local.meetmikey.com';
var debugMode = true;
var useNodetime = false;
var nodetimeAccountKey = '';

var awsBucket = 'mikeymaillocal';
var awsKey = '';
var awsSecret = '';

var azureStorageAccount = 'mikeymaillocal';
var azureStorageAccessKey = '';

var elasticSearchNodes = [{host : 'localhost', port : 9200}];
var elasticSearchIsSecure = false;

var cryptoAESSecret = '';

var mongoHQProd = {};
var objectRocketProd = {};

var googleAppId = '';
var googleAppSecret = '';

var stripeSecretKey = '';

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
  elasticSearchNodes = [{ host : 'esa.meetmikey.com', port : 9201, secure : true}, { host : 'esb.meetmikey.com', port : 9201, secure : true }];
  elasticSearchIsSecure = true;
  awsBucket = 'mikeymail';
  queuePrefix = 'prod';
  var secureConf = require('./secureConf');
  //AppInitUtils does this same check, but let's just be sure.
  if ( ( ! secureConf ) || (typeof secureConf === 'undefined') ) {
    console.error('no secureConf file... exiting now');
    process.exit(1);
  }
  awsKey = secureConf.aws.key;
  awsSecret = secureConf.aws.secret;
  azureStorageAccount = secureConf.azure.storageAccount
  azureStorageAccessKey = secureConf.azure.storageAccessKey
  cryptoAESSecret = secureConf.crypto.aesSecret;
  mongoHQProd = secureConf.mongo.mongoHQProd;
  googleAppId = secureConf.google.appId;
  googleAppSecret = secureConf.google.appSecret;
  stripeSecretKey = secureConf.stripe.secretKey;
  memcached.host = '';
  debugMode = false;
  useNodetime = false;
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
var sqsWorkerQuickQueue = queuePrefix + 'WorkerQuick';
var sqsWorkerReindexQueue = queuePrefix + 'WorkerReindex';
var sqsCacheInvalidationQueue = queuePrefix + 'CacheInvalidation';
var sqsThumbnailQueue = queuePrefix + 'Thumbnail';
var sqsThumbnailQuickQueue = queuePrefix + 'ThumbnailQuick';

module.exports = {
  aws : {
      key: awsKey
    , secret: awsSecret
    , bucket: awsBucket
    , accountID: ''
    , sqsMailReadingQueue: sqsMailReadingQueue
    , sqsMailReadingQuickQueue : sqsMailReadingQuickQueue
    , sqsMailDownloadQueue : sqsMailDownloadQueue
    , sqsMailActiveConnectionQueue : sqsMailActiveConnectionQueue
    , sqsWorkerQueue : sqsWorkerQueue
    , sqsWorkerQuickQueue : sqsWorkerQuickQueue
    , sqsWorkerReindexQueue : sqsWorkerReindexQueue
    , sqsThumbnailQueue : sqsThumbnailQueue
    , sqsThumbnailQuickQueue : sqsThumbnailQuickQueue
    , sqsCacheInvalidationQueue : sqsCacheInvalidationQueue
    , s3Folders: {
        attachment: 'attachment'
      , images: 'images'
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
        , images: 'images'
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
        , pass: ''
        , port: 10025
      }
    , mongoHQDev : {
          host : 'linus.mongohq.com'
        , db: 'mikeyDBDev'
        , user: 'mikey'
        , pass: ''
        , port: 10096
      }
    , objectRocketDev : {
          host : ''
        , db: 'mikeyDBDev'
        , user: 'mikey'
        , pass: ''
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
      secret: ''
  }
  , google : {
      appId: googleAppId
    , appSecret : googleAppSecret
  }
  , domain: domain
  , elasticSearch: {
      nodes: elasticSearchNodes
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
  , tmpEmailDir: '/tmp'
  , diffbot : {
      token : ''
  }
  , googleDriveAPIFileGetPrefix: 'https://www.googleapis.com/drive/v2/files/'
  , validTopLevelDomainsFile: serverCommon + '/data/validTopLevelDomains.txt'
  , memcached : memcached
  , debugMode: debugMode
  , rollbar: {
      token: ''
    , turnedOn: false
  }
  , turnDebugModeOff : function () {
    module.exports.debugMode = false;
  }
  , turnDebugModeOn : function () {
    module.exports.debugMode = true;
  }
  , stripe: {
    secretKey: stripeSecretKey
  }
  , nodetime: {
      useNodetime: useNodetime
    , accountKey: nodetimeAccountKey
  }
  , useNgrok : useNgrok
  , ngrokURL : 'https://mikey.ngrok.com'
}
