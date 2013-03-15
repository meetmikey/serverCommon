var conf = require('../conf')
  , ElasticSearchClient = require('elasticsearchclient')
  , async = require('async')
  , winston= require('./winstonWrapper').winston
  , request = require('request')
  , fs = require('fs')

var serverOptions = {
    host: conf.elasticSearch.host
  , port: conf.elasticSearch.port
}

var esConnect = this;

exports.client = new ElasticSearchClient(serverOptions);

exports.init = function( callback ) {
  async.series([
      esConnect.checkHealth
    , esConnect.checkIndex
    , esConnect.checkMappings
  ], function( err ) {
    callback( err );
  });
}

exports.checkHealth = function(callback) {
  esConnect.client.health()
    .on('data', function(data) {
      winston.doInfo('elastic search health', {data: data});
      callback();
    })
    .on('error', function (err) {
      callback( winston.makeElasticSearchError(err) );
    })
    .exec();
}

exports.checkIndex = function(callback) {
  winston.info ('checkIndex')
  var indexURL = 'http://' + conf.elasticSearch.host + ':' + conf.elasticSearch.port + '/' + conf.elasticSearch.indexName;
  winston.info (indexURL);

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

// check to see if mappings are "defaults" - i.e. everything is a string, source is stored
exports.checkMappings = function (callback) {
  winston.info ('checkMappings');

  async.parallel ([
    function (cb) {
      esConnect.client.getMapping (conf.elasticSearch.indexName, 'resource')
        .on('data', function (data) {
          var parsed = JSON.parse (data);

          if (parsed && parsed.status && parsed.status != 200) {
            cb (winston.makeError ('Non 200 status code from elasticsearch'));
          }
          // check source enabled == false
          else if (!(parsed 
            && parsed.resource 
            && parsed.resource._source 
            && parsed.resource._source.enabled === false)) {

            cb (winston.makeError ('Source enabled for resource not false'));
          }
          // check attachment plugin
          else if (!(parsed
            && parsed.resource
            && parsed.resource.properties
            && parsed.resource.properties.file
            && parsed.resource.properties.file.type === 'attachment')) {

            cb (winston.makeError ('Resource mapping file is not of type attachment'));
          }
          else {
            cb ();
          }

        })
        .on('error', function (err) {
          winston.makeError ('Error trying to check mapping for resource', {err : err});
        })
        .exec();
    },
    function (cb) {
      esConnect.client.getMapping (conf.elasticSearch.indexName, 'resourceMeta')
        .on('data', function (data) {
          var parsed = JSON.parse (data);

          if (parsed && parsed.status && parsed.status != 200) {
            cb (winston.makeError ('Non 200 status code from elasticsearch'));
          }
          // check source enabled == false
          else if (!(parsed 
            && parsed.resourceMeta 
            && parsed.resourceMeta._source 
            && parsed.resourceMeta._source.enabled === false)) {

            cb (winston.makeError ('Source enabled for resourceMeta not false'));
          }
          else {
            cb ();
          }

        })
        .on('error', function (err) {
          winston.makeError ('Error trying to check mapping for resource', {err : err});
        })
        .exec();
    }], function (err) {
      if (err) {
        callback (err)
      }
    });
}