var serverCommon = process.env.SERVER_COMMON;

var appInitUtils = require(serverCommon + '/lib/appInitUtils')
  , conf = require(serverCommon + '/conf')
  , esConnect = require(serverCommon + '/lib/esConnect')
  , winston = require(serverCommon + '/lib/winstonWrapper').winston
  , mongoose = require(serverCommon + '/lib/mongooseConnect').mongoose
  , indexingHandler = require(serverCommon + '/lib/indexingHandler')
  , AttachmentModel = require(serverCommon + '/schema/attachment').AttachmentModel
  , LinkModel = require (serverCommon + '/schema/link').LinkModel;

var initActions = [
    appInitUtils.CONNECT_ELASTIC_SEARCH
  , appInitUtils.CONNECT_MONGO
];

var modelId = '51940d25256f364b2a000057';
var isLink = true;

appInitUtils.initApp('esIndexDocument', initActions, conf, function() {

  var schemaModel = AttachmentModel;
  if ( isLink ) {
    schemaModel = LinkModel;
  }

  var run = function( callback ) {
    schemaModel.findById( modelId, function(err, foundModel) {
      if ( err ) {
        callback( winston.makeMongoError( err ) );

      } else if ( ! foundModel ) {
        callback( winston.makeError('no model with id', {modelId: modelId, isLink: isLink}) );

      } else {
        foundModel["index"] = undefined;
        foundModel.save( function(mongoErr) {
          if ( mongoErr ) {
            callback( winston.makeMongoError( mongoErr ) );

          } else {
            schemaModel.findById( modelId, function(err, foundModel) {
              if ( err ) {
                callback( winston.makeMongoError( err ) );

              } else if ( ! foundModel ) {
                callback( winston.makeError('no model with id', {modelId: modelId, isLink: isLink}) );

              } if ( foundModel.index && foundModel.index.length ) {
                callback( winston.makeError('model still has index') );

              } else {
                var job = indexingHandler.getIndexingJobForDocument( foundModel, isLink );
                job = JSON.parse(JSON.stringify(job));

                if ( ! job ) {
                  callback( winston.makeError('no job') );

                } else {
                  indexingHandler.doIndexingJob( job, function(err) {
                    if ( err ) {
                      callback( err );

                    } else {
                      schemaModel.findById( modelId, function(err, foundModel) {
                        if ( err ) {
                          callback( winston.makeMongoError( err ) );

                        } else if ( ! foundModel ) {
                          callback( winston.makeError('no model with id', {modelId: modelId, isLink: isLink}) );

                        } else if ( !foundModel.index ) {
                          callback( winston.makeError('model has NO index') );

                        } else {
                          callback();
                        }
                      });
                    }
                  });
                }
              }
            });
          }
        });
      }
    });
  };

  run( function(err) {
    if ( err ) {
      winston.handleError( err );

    } else {
      winston.doInfo('success');
    }
    mongoose.disconnect();
  })
});