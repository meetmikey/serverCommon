var serverCommon = process.env.SERVER_COMMON;

var conf = require(serverCommon + '/conf')
  , mongoUtils = require(serverCommon + '/lib/mongoUtils')
  , winston = require (serverCommon + '/lib/winstonWrapper').winston
  , esUtils = require (serverCommon + '/lib/esUtils')
  , utils = require (serverCommon + '/lib/utils')
  , attachmentUtils = require (serverCommon + '/lib/attachmentUtils')
  , esConnect = require ('./esConnect')
  , sqsConnect = require (serverCommon + '/lib/sqsConnect')
  , cloudStorageUtils = require (serverCommon + '/lib/cloudStorageUtils')
  , AttachmentModel = require(serverCommon + '/schema/attachment').AttachmentModel
  , AttachmentInfoModel = require(serverCommon + '/schema/attachmentInfo').AttachmentInfoModel
  , LinkInfoModel = require(serverCommon + '/schema/linkInfo').LinkInfoModel
  , LinkModel = require (serverCommon + '/schema/link').LinkModel
  , MailModel = require(serverCommon + '/schema/mail').MailModel;

var indexingHandler = this;


/*
  push jobs to queue
  -------------------------------------------------------
*/

exports.pushJobToQueue = function ( job, callback ) {
  sqsConnect.addMessageToWorkerQueue (job, function (err) {
    if (err) {
      winston.doError ('Could not add indexing job to worker queue', {job : job});          
    }
  });
}

exports.createIndexingJobForResource = function ( model, isLinkInfo, callback ) {
  
  var resourceId;

  if (isLinkInfo) {
    resourceId = model.comparableURLHash;
  } else {
    resourceId = attachmentUtils.getFileContentId( model );
  }

  var job = {
    jobType : 'index',
    indexName : esConnect.indexName,
    indexType : 'resource',
    isLinkInfo : isLinkInfo,
    modelId : model._id,
    resourceId : resourceId
  }

  indexingHandler.pushJobToQueue (job, callback);

}

exports.createIndexingJobForResourceMeta = function ( model, isLink, callback) {

  var resourceId;
  var modelName;

  if (isLink) {
    resourceId = model.comparableURLHash;
    modelName = 'Link';
  } else {
    resourceId = attachmentUtils.getFileContentId( model );
    modelName = 'Attachment';
  }

  var job = {
    jobType : 'index',
    indexName : esConnect.indexName,
    indexType : 'resourceMeta',
    parentId : resourceId,
    isLink : isLink,
    modelId : model._id,
    mailId : model.mailId,
    modelName : modelName
  }

  indexingHandler.pushJobToQueue (job, callback);

}



/*
  handle jobs from queue
  -------------------------------------------------------
*/

exports.doIndexingJob = function ( job, callback ) {
  if (job.jobType === 'index' && job.indexType === 'resource') {
    indexingHandler.doIndexingResourceJob (job, callback);
  } else if (job.jobType === 'index' && job.indexType === 'resourceMeta') {
    indexingHandler.doIndexingResourceMetaJob (job, callback);
  } else {
    callback (winston.makeError ('indexingHandler : invalid indexType', {job : job}));
  }
}


exports.doIndexingResourceJob = function ( job, callback ) {
  winston.doInfo ('doIndexingResourceJob', {job : job});

  var isLinkInfo = job.isLinkInfo;
  var modelId = job.modelId;
  var resourceId = job.resourceId;
  var cloudPath;

  if (isLinkInfo) {
    cloudPath = conf.aws.s3Folders.linkInfo + '/' + resourceId;
  } else {
    cloudPath = conf.aws.s3Folders.attachment + '/' + resourceId;    
  }

  if ( ! cloudPath ) { callback (winston.makeMissingParamError('cloudPath')); }
  if ( ! resourceId ) { callback (winston.makeMissingParamError('resourceId')); }
  if ( ! modelId ) { callback (winston.makeMissingParamError('modelId')); }
  if ( typeof isLinkInfo == 'undefined' ) { callback (winston.makeMissingParamError('isLinkInfo')); }

  var useGzip = true;
  var inAzure = false;

  // get the file from s3
  cloudStorageUtils.getFile (cloudPath, useGzip, inAzure, function (err, res) {
    if (err) {
      callback (winston.makeError ('Indexing handler: error getting file from s3', {err : err, resourceId : resourceId}));
    } else {
      // convert response to buffer
      utils.streamToBuffer (res, function (err, buffer) {
        if (err) {
          callback (winston.makeError ('could not convert stream to buffer', {err : err}));
        }
        else {
          // fetch the resource from the db
          var Model = AttachmentInfoModel;
          if (isLinkInfo) {
            Model = LinkInfoModel;
          }

          Model.findById (modelId, function (err, foundResource) {
            if (err) {
              callback (winston.makeMongoError (err));
            } else if (!foundResource) {
              callback (winston.makeError ('could not find resource', {isLinkInfo : isLinkInfo, _id : modelId}));
            } else {
              indexingHandler.indexResource ( foundResource, buffer, resourceId, isLinkInfo, callback );
            }
          });

        }
      });
    }
  });

}

exports.doIndexingResourceMetaJob = function ( job, callback ) {
  winston.doInfo ('doIndexingResourceMetaJob', {job : job});

  var isLink = job.isLink;
  var parentId = job.parentId;
  var mailId = job.mailId;
  var modelId = job.modelId;
  var modelName = job.modelName;

  if ( ! modelId ) { callback (winston.makeMissingParamError('modelId')); }
  if ( ! parentId ) { callback (winston.makeMissingParamError('parentId')); }
  if ( ! mailId ) { callback (winston.makeMissingParamError('mailId')); }
  if ( ! modelName ) { callback (winston.makeMissingParamError('modelName')); }
  if ( typeof isLink == 'undefined' ) { callback (winston.makeMissingParamError('isLink')); }

  var mailBodyRemotePath = conf.aws.s3Folders.mailBody + '/' + mailId;
  
  var useGzip = true;
  var inAzure = false;

  // get the mail from s3
  cloudStorageUtils.getFile (mailBodyRemotePath, useGzip, inAzure, function (err, res) {
    if (err) {
      callback (winston.makeError ('Indexing handler: error getting file from s3', {err : err, path : mailBodyRemotePath}));
    }
    else {
      // convert response to buffer
      utils.streamToBuffer (res, function (err, buffer) {
        if (err) {
          callback (winston.makeError ('could not convert stream to buffer', {err : err}));
        } else {
          try {

            // parse the response
            var msgJSON = JSON.parse (buffer);

            var mail = {
              _id : mailId,
              bodyHTML : msgJSON.bodyHTML,
              bodyText : msgJSON.bodyText
            }
            
            // get the link or attachment from the db
            var Model = LinkModel;
            if (modelName == 'Attachment') {
              Model = AttachmentModel;
            }

            Model.findById (modelId, function (err, foundModel) {
              if (err) {
                callback (winston.makeMongoError (err));
              } else if (!foundModel) {
                callback (winston.makeError ('model not found', {name : modelName, _id : modelId}));
              } else {
                indexingHandler.indexResourceMetadata( foundModel, mail, parentId, isLink, callback );
              }
            });

          } catch (e) {
            callback (winston.makeError ('Could not parse mail body stored in s3', {msg : e.message, stack : e.stack}));
          }
        }
      });
    }
  });
}




/*
  Generic indexing functions
  -------------------------------------------------------
*/

exports.indexResource = function( resource, resourceBytes, resourceId, isLinkInfo, callback ) {

  if ( ! resource ) { winston.doMissingParamError('resource'); return; }
  if ( ! resourceBytes ) { winston.doMissingParamError('resourceBytes'); return; }
  if ( ! resourceId ) { winston.doMissingParamError('resourceId'); return; }
  if ( typeof isLinkInfo == 'undefined' ) { winston.doMissingParamError('isLinkInfo'); return; }

  //winston.doInfo('indexResource', resourceId);
  var indexData = indexingHandler.getIndexDataForResource( resource, resourceBytes, isLinkInfo );
  var parentId = null;

  // TODO: allow multiple index handles to be open in elasticsearch...
  esUtils.index( esConnect.indexName, 'resource', resourceId, indexData, parentId,
    function( esUtilsError ) {
      indexingHandler.updateResourceIndexState( resource, isLinkInfo, esUtilsError, callback );
    }
  );
}

// resourceMetadata here is either an attachment or link
exports.indexResourceMetadata = function( resourceMetadata, mail, parentId, isLink, callback ) {
  winston.doInfo ('indexResourceMetadata');

  if ( ! resourceMetadata ) { winston.doMissingParamError('resourceMetadata'); return; }
  if ( ! mail ) { winston.doMissingParamError('mail'); return; }
  if ( ! parentId ) { winston.doMissingParamError('parentId'); return; }

  //winston.doInfo('indexResourceMetadata', {resourceId : resourceMetadata._id});
  var indexData = indexingHandler.getIndexDataForResourceMetadata( resourceMetadata, isLink, mail );

  // TODO: allow multiple index handles to be open in elasticsearch...
  esUtils.index( esConnect.indexName, 'resourceMeta', String(resourceMetadata._id), indexData, parentId,
    function( esUtilsError ) {
      indexingHandler.updateResourceMetadataIndexState( resourceMetadata, isLink, esUtilsError, callback );
    }
  );
}


exports.updateResourceMetadataIndexState = function( resourceMetadata, isLink, esUtilsError, callback ) {

  if ( ! resourceMetadata ) { winston.doMissingParamError('resourceMetadata'); return; }
  if ( typeof isLink === 'undefined' ) { winston.doMissingParamError('isLink'); return; }

  var shardKey = mongoUtils.getShardKeyHash( resourceMetadata.userId );
  var Model = AttachmentModel;
  if ( isLink ) {
    Model = LinkModel;
  }

  var filter = {
      _id : resourceMetadata._id
    , shardKey: shardKey
  };

  var updateSet = indexingHandler.getDefaultUpdateSet();

  if ( esUtilsError ) {
    var indexState = 'softFail';
    if ( esUtilsError.errorType && ( esUtilsError.errorType == esUtils.ERROR_TYPE_BAD_RESPONSE ) ) {
      //These errors seem to indicate that this resource is not ES-compatible, so not worth re-trying.
      indexState = 'hardFail';
    }
    updateSet['$set']['indexState'] = indexState;
  }

  Model.update( filter, updateSet, function (err, num) {
    if ( err ) { 
      callback ( winston.makeMongoError(err) );
    } else if ( num == 0 ) {
      callback (winston.makeError('Zero records affected when updating indexState'));
    } else {
      // TODO: callback with an error depending on number of indexing attempts
      callback ();
    }
  });
}

exports.updateResourceIndexState = function( resource, isLinkInfo, esUtilsError, callback ) {

  if ( ! resource ) { winston.doMissingParamError('resource'); return; }
  if ( typeof isLinkInfo === 'undefined' ) { winston.doMissingParamError('isLinkInfo'); return; }
  
  var Model = AttachmentInfoModel;
  var filter = {
      hash: resource.hash
    , fileSize: resource.fileSize
  };

  if (isLinkInfo) {
    Model = LinkInfoModel;
    filter = {comparableURLHash : resource.comparableURLHash};
  }

  var updateSet = indexingHandler.getDefaultUpdateSet ();

  if ( esUtilsError ) {
    var indexState = 'softFail';
    if ( esUtilsError.errorType && ( esUtilsError.errorType == esUtils.ERROR_TYPE_BAD_RESPONSE ) ) {
      //These errors seem to indicate that this resource is not ES-compatible, so not worth re-trying.
      indexState = 'hardFail';
    }
    updateSet['$set']['indexState'] = indexState;
  }

  Model.update( filter, updateSet, function (err, num) {
    if ( err ) { 
      callback ( winston.makeMongoError(err) );
    } else if ( num == 0 ) {
      callback (winston.makeError('Zero records affected when updating indexState'));
    } else {
      // TODO: callback with an error depending on number of indexing attempts
      callback ();
    }
  });

}


exports.getDefaultUpdateSet = function () {
  return { $set:{ 'index.indexState': 'done' },
           $inc : { 'index.tries' : 1 },
           version : esConnect.indexName };
}

exports.getIndexDataForResourceMetadata = function( resource, isLink, mail ) {
  var emailBody = mail.bodyText;

  if (!mail.bodyText) {
    emailBody = mail.bodyHTML
  }

  if (resource && resource.recipients) {
    var recipientNames = resource.recipients.map (function (rec) { return rec.name});
    var recipientEmails = resource.recipients.map (function (rec) { return rec.email});
  }

  if (resource && resource.sender) {
    var authorName = resource.sender.name;
    var authorEmail = resource.sender.email;
  }

  var indexData = {
    authorName : authorName,
    authorEmail : authorEmail,
    recipientNames : recipientNames,
    recipientEmails : recipientEmails,
    userId : resource.userId,
    emailBody: emailBody,
    emailSubject: resource.cleanSubject,
    mailId : mail._id,
    date : resource.gmDate
  }

  if (isLink) {
    indexData ["url"] = resource.url;
    indexData ["isLink"] = true;
  }
  else {
    indexData ["filename"] = resource.filename;
    indexData ["isLink"] = false;
  }

  return indexData
}

exports.getIndexDataForResource = function (resource, resourceBytes, isLink) {

  var indexData = {
    'isLink' : isLink
  }

  if (!isLink) {
    indexData ['size'] = resource.fileSize;
    indexData ['docType'] = resource.docType;
    
    if (!resource.isImage &&
        resource.docType != 'video' && 
        resource.docType != 'image' && 
        resource.docType != 'photoshop') {
      indexData ['file'] = resourceBytes.toString('base64');
    }

  }
  else {
    indexData ['docType'] = resource.docType;
    indexData['file'] = new Buffer(resourceBytes).toString('base64');
  }

  return indexData;

}

exports.packageDiffbotResponseInHTML = function( diffbotResponse ) {
  if ( diffbotResponse ) {
    return indexingHandler.packageInHTML( diffbotResponse.title, diffbotResponse.text );
  }
  return '';
}

exports.packageInHTML = function( title, text ) {

  if ( ( ! title ) && ( ! text ) ) {
    return '';
  }

  var html = '<html><head><title> ';
  html += title;
  html += '</title></head><body>';
  html += text;
  html += '</body></html>';
  return html;
}
