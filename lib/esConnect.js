var ElasticSearchClient = require('elasticsearchclient')
  , async = require('async')
  , winston= require('./winstonWrapper').winston
  , request = require('request');

var esConnect = this;
esConnect.nodes = [];

exports.getClient = function () {
  if (esConnect.privateClient) {
    return esConnect.privateClient;
  }
  else {
    winston.doError ('es client not defined');
    process.exit(1);
  }
}

exports.indexName = esConnect.indexName;

exports.init = function( conf, callback ) {

  esConnect.conf = conf;
  esConnect.indexName = conf.elasticSearch.indexName;

  var serverOptions = {
    hosts : esConnect.conf.elasticSearch.nodes
  };
  esConnect.nodes = esConnect.conf.elasticSearch.nodes;

  if ( esConnect.conf.elasticSearch.useSSL ) {
    serverOptions['secure'] = true;
  }

  winston.doInfo('ES serverOptions', {serverOptions: serverOptions});

  esConnect.privateClient = new ElasticSearchClient(serverOptions);

  async.series([
      esConnect.checkHealth
    , esConnect.checkIndex
    , esConnect.checkMappings
  ], function( err ) {
    callback(err);
  });
}

exports.checkHealth = function(callback) {

  esConnect.getClient().health()
    .on('data', function(data) {
      var parsed = JSON.parse (data);

      var acceptStatuses = ['green', 'yellow'];


      if (parsed && parsed.status && acceptStatuses.indexOf(parsed.status) == -1) {
        callback (winston.makeElasticSearchError ('non 200 status code from ES', {data : data}));
      }
      else {
        winston.doInfo('elastic search health', {data: data});
        callback();        
      }
    })
    .on('error', function (err) {
      callback( winston.makeElasticSearchError(err) );
    })
    .exec();
}

exports.checkIndex = function(callback) {
  winston.doInfo('checkIndex')
  if (!esConnect.nodes.length) {
    return callback (winston.makeError ('no elasticsearch nodes defined'));
  }
  var indexURL = esConnect.getProtocol() + esConnect.nodes[0].host + ':' + esConnect.nodes[0].port + '/' + esConnect.conf.elasticSearch.indexName;
  winston.doInfo(indexURL);

  request(indexURL, {method : 'HEAD'}, function (err, response) {
    if ( err || ( ! response ) || ( response.statusCode != 200 ) ) {
      var statusCode = null;
      if ( response ) {
        statusCode = response.statusCode
      }
      callback( winston.makeError('check index failed', {requestErr: err, statusCode: statusCode} ) );

    } else {
      callback();
    }
  });
}

exports.checkAlias = function (aliasName, callback) {
  if (!esConnect.nodes.length) {
    return callback (winston.makeError ('no elasticsearch nodes defined'));
  }

  var indexURL = esConnect.getProtocol() + esConnect.nodes[0].host + ':' + esConnect.nodes[0].port + '/' + aliasName + "_" + esConnect.indexName;
  
  request(indexURL, {method : 'HEAD'}, function (err, response) {
    if ( err || ( ! response ) || ( response.statusCode != 200 ) ) {
      var statusCode = null;
      if ( response ) {
        statusCode = response.statusCode
      }
      callback( winston.makeError('check alias failed', {requestErr: err, statusCode: statusCode} ) );

    } else {
      callback();
    }
  });
}

exports.getProtocol = function() {
  var protocol = 'http';
  if ( esConnect.conf.elasticSearch.useSSL ) {
    protocol += 's';
  }
  protocol += '://';
  return protocol;
}

// check to see if mappings are "defaults" - i.e. everything is a string, source is stored
exports.checkMappings = function (cb) {
  winston.doInfo('checkMappings');

  esConnect.getClient().getMapping (esConnect.conf.elasticSearch.indexName, 'document')
    .on('data', function (data) {
      var parsed = JSON.parse (data);

      if (parsed && parsed.status && parsed.status != 200) {
        cb (winston.makeError ('Non 200 status code from elasticsearch'));
      }
      // check source enabled == false
      else if (!(parsed 
        && parsed.document 
        && parsed.document._source 
        && parsed.document._source.enabled === false)) {

        cb (winston.makeError ('Source enabled for resource not false'));
      }
      // check attachment plugin
      else if (!(parsed
        && parsed.document
        && parsed.document.properties
        && parsed.document.properties.file
        && parsed.document.properties.file.type === 'attachment')) {

        cb (winston.makeError ('Resource mapping file is not of type attachment'));
      }
      else {
        cb ();
      }

    })
    .on('error', function (err) {
      cb (winston.makeError ('Error trying to check mapping for document', {err : err}));
    })
    .exec();

}