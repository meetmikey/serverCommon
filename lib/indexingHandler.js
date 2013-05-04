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
  , constants = require ('../constants')
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
  sqsConnect.addMessageToWorkerQueue (job, function( err ) {
    if ( err ) {
      callback( winston.makeError('Could not add indexing job to worker queue', {job : job}) );

    } else {
      callback();
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

exports.createIndexingJobForDocument = function ( model, isLink, callback) {

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
    indexType : 'document',
    resourceId : resourceId,
    isLink : isLink,
    modelId : model._id,
    mailId : model.mailId,
    modelName : modelName
  }

  if (!isLink) {
    job.resourceDocType = model.resourceDocType;
  }

  indexingHandler.pushJobToQueue (job, callback);

}



/*
  handle jobs from queue
  -------------------------------------------------------
*/

exports.doIndexingJob = function ( job, callback ) {
  if (job.jobType === 'index' && job.indexType === 'document') {
    indexingHandler.doIndexingJob (job, callback);
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

  if ( ! cloudPath ) { callback (winston.makeMissingParamError('cloudPath')); return; }
  if ( ! resourceId ) { callback (winston.makeMissingParamError('resourceId')); return; }
  if ( ! modelId ) { callback (winston.makeMissingParamError('modelId')); return; }
  if ( typeof isLinkInfo == 'undefined' ) { callback (winston.makeMissingParamError('isLinkInfo')); return; }

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

exports.doIndexingDocumentJob = function ( job, callback ) {
  winston.doInfo ('doIndexingDocumentJob', {job : job});

  var isLink = job.isLink;
  var resourceId = job.resourceId;
  var mailId = job.mailId;
  var modelId = job.modelId;
  var modelName = job.modelName;
  var resourceDocType = job.resourceDocType;

  if ( ! modelId ) { callback (winston.makeMissingParamError('modelId')); return; }
  if ( ! parentId ) { callback (winston.makeMissingParamError('parentId')); return; }
  if ( ! mailId ) { callback (winston.makeMissingParamError('mailId')); return; }
  if ( ! modelName ) { callback (winston.makeMissingParamError('modelName')); return; }
  if ( typeof isLink == 'undefined' ) { callback (winston.makeMissingParamError('isLink')); return; }

  var resourcePath;
  if (isLink) {
    resourcePath = conf.aws.s3Folders.linkInfo + '/' + resourceId;
  } else {
    resourcePath = conf.aws.s3Folders.attachment + '/' + resourceId;    
  }


  var mailPath = conf.aws.s3Folders.mailBody + '/' + mailId;
  
  // get the document to be indexed from the DB and make sure mail versions still match
  var Model = LinkModel;

  if (modelName == 'Attachment') {
    Model = AttachmentModel;
  }

  Model.findById (modelId, function (err, foundModel) {
    if (err) {
      callback (winston.makeMongoError (err));
    } else if (!foundModel) {
      callback (winston.makeError ('model not found', {name : modelName, _id : modelId}));
    } else if (foundModel.mailId != mailId) { // TODO: test casting
      winston.doWarn ('Not indexing document because mailId has changed');
      callback ();
    } else {
      indexingHandler.getMailAndResource (mailPath, resourcePath, resourceDocType, function (err, buffers) {
        var mail = buffers [0];
        var resource = buffers [1];



      });
    }
  });

  



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


exports.getMailAndResource = function (mailPath, resourcePath, resourceDocType, callback) {
  var useGzip = true;
  var inAzure = false;

  // get the mail and resource (depending on content type) from storage
  async.parallel([
    function(asyncCb){
      // get the mail from s3
      cloudStorageUtils.getFile (mailPath, useGzip, inAzure, function (err, res) {
        if (err) {
          asyncCb (winston.makeError ('Indexing handler: error getting file from s3', {err : err, path : mailPath}));
        }
        else {
          // convert response to buffer
          utils.streamToBuffer (res, function (err, buffer) {
            if (err) {
              asyncCb (winston.makeError ('could not convert stream to buffer', {err : err}));
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

              } catch (e) {
                asyncCb (winston.makeError ('Could not parse mail body stored in s3', {msg : e.message, stack : e.stack}));
              }
            }
          });
        }
      });
    },
    function(asyncCb){

      // don't need to get the file since we'll be indexing as stub
      if (!isLink && !attachmentUtils.resourceDocTypeIndexable (resourceDocType)) {
        asyncCb (null, '');
      } else {

        // get the file from s3
        cloudStorageUtils.getFile (resourcePath, useGzip, inAzure, function (err, res) {
          if (err) {
            asyncCb (winston.makeError ('Indexing handler: error getting file from s3', {err : err, resourceId : resourceId}));
          } else {
            // convert response to buffer
            utils.streamToBuffer (res, function (err, buffer) {
              if (err) {
                asyncCb (winston.makeError ('could not convert stream to buffer', {err : err}));
              } else {
                asyncCb (null, buffer);
              }
            });
          }
        });

      }

    }
  ], callback);

}


/*
  Generic indexing functions
  -------------------------------------------------------
*/

exports.indexResource = function( resource, resourceBytes, resourceId, isLinkInfo, callback ) {

  if ( ! resource ) { callback( winston.makeMissingParamError('resource') ); return; }
  if ( ! resourceBytes ) { callback( winston.makeMissingParamError('resourceBytes') ); return; }
  if ( ! resourceId ) { callback( winston.makeMissingParamError('resourceId') ); return; }
  if ( typeof isLinkInfo == 'undefined' ) { callback( winston.makeMissingParamError('isLinkInfo') ); return; }

  //winston.doInfo('indexResource', resourceId);
  var indexData = indexingHandler.getIndexDataForResource( resource, resourceBytes, isLinkInfo );
  var parentId = null;

  // TODO: allow multiple index handles to be open in elasticsearch...
  esUtils.index( esConnect.indexName, 'resource', resourceId, indexData, parentId,
    function( esUtilsError ) {
      indexingHandler.updateResourceIndexState( resource, isLinkInfo, esUtilsError, resourceId, callback );
    }
  );
}

// resourceMetadata here is either an attachment or link
exports.indexResourceMetadata = function( resourceMetadata, mail, parentId, isLink, callback ) {
  winston.doInfo ('indexResourceMetadata');

  if ( ! resourceMetadata ) { callback( winston.makeMissingParamError('resourceMetadata') ); return; }
  if ( ! mail ) { callback( winston.makeMissingParamError('mail') ); return; }
  if ( ! parentId ) { callback( winston.makeMissingParamError('parentId') ); return; }

  //winston.doInfo('indexResourceMetadata', {resourceId : resourceMetadata._id});
  var indexData = indexingHandler.getIndexDataForResourceMetadata( resourceMetadata, isLink, mail );

  // TODO: allow multiple index handles to be open in elasticsearch...
  esUtils.index( esConnect.indexName, 'resourceMeta', String(resourceMetadata._id), indexData, parentId,
    function( esUtilsError ) {
      indexingHandler.updateResourceMetadataIndexState( resourceMetadata, isLink, esUtilsError, callback );
    }
  );
}

exports.deleteResourceMetadata = function( resourceMetadata, isLink, callback ) {

  if ( ! resourceMetadata ) { callback( winston.makeMissingParamError('resourceMetadata') ); return; }

  var parentId;
  if ( isLink ) {
    parentId = resourceMetadata.comparableURLHash;
  } else {
    parentId = attachmentUtils.getFileContentId( resourceMetadata );
  }

  esUtils.delete( esConnect.indexName, 'resourceMeta', String(resourceMetadata._id), parentId, callback );
}

exports.updateResourceMetadataIndexState = function( resourceMetadata, isLink, esUtilsError, callback ) {

  if ( ! resourceMetadata ) { callback( winston.makeMissingParamError('resourceMetadata') ); return; }
  if ( typeof isLink === 'undefined' ) { callback( winston.makeMissingParamError('isLink') ); return; }

  var Model = AttachmentModel;
  if ( isLink ) {
    Model = LinkModel;
  }

  var filter = {
    _id : resourceMetadata._id
  };

  var updateSet = indexingHandler.getDefaultUpdateSet();

  if ( esUtilsError ) {
    var indexState = 'softFail';
    updateSet['$set']['indexState'] = indexState;
  }

  Model.findOneAndUpdate( filter, updateSet, function (err, foundResourceMeta) {
    if ( err ) { 
      callback ( winston.makeMongoError(err) );
    } else if ( !foundResourceMeta ) {
      callback ( winston.makeError('No records affected when updating indexState for resourceMeta', filter) );
    } else {
      if (!esUtilsError) {
        callback ();
      }
      else if (foundResourceMeta.index.tries > constants.MAX_INDEXING_ATTEMPTS) {
        esUtilsError.deleteFromQueue = true;
        callback (winston.makeError ('failed indexing, requeuing job', esUtilsError));
      }
    }
  });
}


exports.updateResourceMetadataIndexState = function( resourceMetadata, isLink, esUtilsError, callback ) {

  if ( ! resourceMetadata ) { callback( winston.makeMissingParamError('resourceMetadata') ); return; }
  if ( typeof isLink === 'undefined' ) { callback( winston.makeMissingParamError('isLink') ); return; }

  var indexStateExistsForVersion = false;
  var indexStateArrayIndex = 0;

  // check length of index array and find the appropriate version
  if (resourceMetadata && resourceMetadata.index && resourceMetadata.index.length) {
    var checkReturnVal = indexingHandler.checkIndexStateVersionMatch (resourceMetadata.index);
    indexStateExistsForVersion = checkReturnVal.indexStateExistsForVersion;
    indexStateArrayIndex = checkReturnVal.indexStateArrayIndex;
  } 

  if (!indexStateExistsForVersion) {
    // create a new entry
    var indexState = {
      version : esConnect.indexName
    };

    var length = resourceMetadata.index.push (indexState);
    indexStateExistsForVersion = true;
    indexStateArrayIndex = length - 1;
  }

  if (esUtilsError) {
    resourceMetadata.index [indexStateArrayIndex].indexState = 'softFail';
    resourceMetadata.index [indexStateArrayIndex].tries += 1;
  } else {
    resourceMetadata.index [indexStateArrayIndex].indexState = 'done';
    resourceMetadata.index [indexStateArrayIndex].tries += 1;
  }

  resourceMetadata.save (function (err) {
    if ( err ) { 
      callback ( winston.makeMongoError(err) );
    }
    else {
      if (!esUtilsError) {
        callback ();
      }
      else if (resourceMetadata.index [indexStateArrayIndex].tries > constants.MAX_INDEXING_ATTEMPTS) {
        esUtilsError.deleteFromQueue = true;
        var logData = {
          resourceMetadataId : resourceMetadata._id,
          isLink : isLink,
          err : esUtilsError
        };

        callback (winston.makeError ('failed indexing too many times, deleting job from queue', logData));
      }
    }
  });

}

exports.updateResourceIndexState = function( resource, isLinkInfo, esUtilsError, resourceKey, callback ) {

  if ( ! resource ) { callback( winston.makeMissingParamError('resource') ); return; }
  if ( typeof isLinkInfo === 'undefined' ) { callback( winston.makeMissingParamError('isLinkInfo') ); return; }
  
  var indexStateExistsForVersion = false;
  var indexStateArrayIndex = 0;

  // check length of index array and find the appropriate version
  if (resource && resource.index && resource.index.length) {
    var checkReturnVal = indexingHandler.checkIndexStateVersionMatch (resource.index);
    indexStateExistsForVersion = checkReturnVal.indexStateExistsForVersion;
    indexStateArrayIndex = checkReturnVal.indexStateArrayIndex;
  } 

  if (!indexStateExistsForVersion) {
    // create a new entry
    var indexState = {
      version : esConnect.indexName
    };

    var length = resource.index.push (indexState);
    indexStateExistsForVersion = true;
    indexStateArrayIndex = length - 1;
  }

  if (esUtilsError) {
    resource.index[indexStateArrayIndex].indexState = 'softFail';
    resource.index[indexStateArrayIndex].tries += 1;
  } else {
    resource.index [indexStateArrayIndex].indexState = 'done';
    resource.index [indexStateArrayIndex].tries += 1;
  }

  resource.save (function (err) {
    if ( err ) { 
      callback ( winston.makeMongoError(err) );
    } 
    else {
      if (!esUtilsError) {
        callback ();
      }
      else if (resource.index[indexStateArrayIndex].tries > constants.MAX_INDEXING_ATTEMPTS) {
        indexingHandler.indexResourceAsStub (resource, resourceKey, isLinkInfo, callback);
      }
      else {
        var logData = {
          resourceId : resource._id,
          isLinkInfo : isLinkInfo,
          err : esUtilsError
        };

        callback (winston.makeError ('failed indexing and not deleting from queue', logData));
      }
    }
  });

}


exports.checkIndexStateVersionMatch = function (indexStateArray) {
  var indexStateExistsForVersion = false;
  var indexStateArrayIndex = 0;
  var arrIndex = 0;

  indexStateArray.forEach (function (indexState) {
    if (indexState.version === esConnect.indexName) {
      indexStateExistsForVersion = true;
      indexStateArrayIndex = arrIndex;
    }
    arrIndex +=1;
  });

  return {
    indexStateExistsForVersion : indexStateExistsForVersion,
    indexStateArrayIndex : indexStateArrayIndex
  };
}

exports.indexResourceAsStub = function (resource, resourceKey, isLinkInfo, callback) {
  
  // try to index as a stub
  var indexData = indexingHandler.getIndexDataForResourceStub (resource, isLinkInfo);
  var parentId = null;

  esUtils.index( esConnect.indexName, 'resource', resourceKey, indexData, parentId,
    function( esUtilsError ) {
      if (esUtilsError) {
       esUtilsError.deleteFromQueue = true;
       callback (winston.makeError ('failed indexing and deleting from queue', esUtilsError));              
      } else {
        resource.index.asStub = true;

        resource.save (function (err) {
          if (err) {
            callback (winston.makeMongoError (err));
          } else {
            callback ();
          }
        }); 
      }
    }
  );
}

exports.getDefaultUpdateSet = function () {
  return { $set: { 'index.indexState': 'done', 'index.version' : esConnect.indexName },
           $inc : { 'index.tries' : 1 } };
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
    date : resource.sentDate.getTime()
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
    indexData['file'] = new Buffer(resourceBytes).toString('base64');
  }

  return indexData;

}

exports.getIndexDataForResourceStub = function (resource, isLink) {
  var indexData = {
    'isLink' : isLink
  }

  if (!isLink) {
    indexData ['docType'] = resource.docType;
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
