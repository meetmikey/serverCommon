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

exports.init = function() {
  async.series([
      esConnect.checkHealth
    , esConnect.checkIndex
    , esConnect.applyMappings
  ], function(err) {
    if ( err ) {
      winston.handleError(err);
      //process.exit(1);
    }
  });
}

exports.checkHealth = function(callback) {
  esConnect.client.health()
    .on('data', function(data) {
      winston.info('elastic search health', {data: data});
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

exports.applyMappings = function(callback) {

  async.forEach( conf.elasticSearch.mappingConfigs, function(mappingConfig, forEachCallback) {

    var mappingName = mappingConfig.mappingName;
    var configFile = mappingConfig.configFile;

    fs.readFile(configFile, function (err, configFileData) {
      if ( err ) {
        forEachCallback( winston.makeError('failed to read mapping config file', {mappingConfig: mappingConfig}) );

      } else if ( ! configFileData ) {
        forEachCallback( winston.makeError('no data in elastic search mapping config file', {mappingConfig: mappingConfig}) );

      } else {
        var mappingData = JSON.parse( configFileData );

        esConnect.client.putMapping( conf.elasticSearch.indexName, mappingName, mappingData)
          .on('data', function( responseData ) {
            var responseJSON = JSON.parse (responseData);

            if (responseJSON.error || responseData.statusCode > 200) {
              forEachCallback( winston.makeElasticSearchError('esConnect : applyMappings fail', {responseData: responseData, mappingName: mappingName}) );
            }
            else {
              winston.info('esConnect: applyMappings: applied mapping', {responseData: responseData, mappingName: mappingName});
              forEachCallback();              
            }
          })
          .on('error', function( mappingErr ) {
            forEachCallback( winston.makeElasticSearchError(mappingErr) );
          })
          .exec();
      }
    });

  }, function(err) {
    callback(err);
  });
}

esConnect.init();