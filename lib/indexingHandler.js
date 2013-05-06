var serverCommon = process.env.SERVER_COMMON;

var conf = require(serverCommon + '/conf')
  , winston = require (serverCommon + '/lib/winstonWrapper').winston
  , esUtils = require (serverCommon + '/lib/esUtils')
  , utils = require (serverCommon + '/lib/utils')
  , attachmentUtils = require (serverCommon + '/lib/attachmentUtils')
  , esConnect = require ('./esConnect')
  , sqsConnect = require (serverCommon + '/lib/sqsConnect')
  , cloudStorageUtils = require (serverCommon + '/lib/cloudStorageUtils')
  , constants = require ('../constants')
  , async = require ('async')
  , AttachmentModel = require(serverCommon + '/schema/attachment').AttachmentModel
  , LinkModel = require (serverCommon + '/schema/link').LinkModel;

var indexingHandler = this;


/*
  push jobs to queue
  -------------------------------------------------------
*/

exports.pushJobToQueue = function ( job, isReindexing, callback ) {
  var queueAddFunction = sqsConnect.addMessageToWorkerQueue;

  if (isReindexing) {
    queueAddFunction = sqsConnect.addMessageToWorkerReindexQueue;
  } 

  queueAddFunction (job, function( err ) {
    if ( err ) {
      callback( winston.makeError('Could not add indexing job to worker queue', {job : job}) );

    } else {
      callback();
    }
  });
}

exports.createIndexingJobForDocument = function ( model, isLink, isReindexing, callback) {

  if ( typeof isLink == 'undefined' ) { callback (winston.makeMissingParamError('isLink')); return; }
  if ( typeof isReindexing == 'undefined' ) { callback (winston.makeMissingParamError('isReindexing')); return; }
  if ( ! model ) { callback (winston.makeMissingParamError('model')); return; }

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
  };

  indexingHandler.pushJobToQueue (job, isReindexing, callback);

}



/*
  handle jobs from queue
  -------------------------------------------------------
*/

exports.doIndexingJob = function ( job, callback ) {
  if (job.jobType === 'index' && job.indexType === 'document') {
    indexingHandler.doIndexingDocumentJob (job, callback);
  } else {
    callback (winston.makeError ('indexingHandler : invalid indexType', {job : job}));
  }
}


exports.doIndexingDocumentJob = function ( job, callback ) {
  winston.doInfo ('doIndexingJob', {job : job});

  var isLink = job.isLink;
  var resourceId = job.resourceId;
  var mailId = job.mailId;
  var modelId = job.modelId;
  var modelName = job.modelName;

  if ( typeof isLink == 'undefined' ) { callback (winston.makeMissingParamError('isLink')); return; }
  if ( ! resourceId ) { callback (winston.makeMissingParamError('resourceId')); return; }
  if ( ! mailId ) { callback (winston.makeMissingParamError('mailId')); return; }
  if ( ! modelId ) { callback (winston.makeMissingParamError('modelId')); return; }
  if ( ! modelName ) { callback (winston.makeMissingParamError('modelName')); return; }

  var resourcePath;
  var resourceSize;

  if (isLink) {
    resourcePath = conf.aws.s3Folders.linkInfo + '/' + resourceId;
  } else {
    resourcePath = conf.aws.s3Folders.attachment + '/' + resourceId;    
    resourceSize = job.resourceId.split ("_")[1];
  }

  var mailPath = conf.aws.s3Folders.mailBody + '/' + mailId;
  
  // get the document to be indexed from the DB and make sure mail versions still match
  var AttOrLinkModel = LinkModel;

  if (modelName == 'Attachment') {
    AttOrLinkModel = AttachmentModel;
  }

  AttOrLinkModel.findById (modelId, function (err, foundAttOrLink) {
    if (err) {
      callback (winston.makeMongoError (err));
    } else if (!foundAttOrLink) {
      callback (winston.makeError ('model not found', {name : modelName, _id : modelId}));
    } else if (foundAttOrLink.mailId != mailId) { // TODO: test casting
      winston.doWarn ('Not indexing document because mailId has changed');
      callback ();
    } else {
      indexingHandler.getMailAndResource (isLink, mailId, mailPath, resourcePath, foundAttOrLink.docType, foundAttOrLink.index, function (err, response) {
        if (err) {
          callback (err);
        } else {
          var mailObj = response [0];
          var resourceBuffer = response [1];

          var indexData = indexingHandler.getIndexDataForDocument( foundAttOrLink, resourceBuffer, mailObj, isLink );
          var parentId = null;

          esUtils.index( esUtils.getIndexAliasForUser (foundAttOrLink.userId), 'document', modelId, indexData, parentId,
            function( esUtilsError ) {
              indexingHandler.updateAttOrLinkIndexState( foundAttOrLink, isLink, esUtilsError, callback );
            }
          );

        }
      });
    }
  });

}


exports.getMailAndResource = function (isLink, mailId, mailPath, resourcePath, docType, currentIndexState, callback) {
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
                
                asyncCb (null, mail);

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
      if (!isLink && !attachmentUtils.resourceDocTypeIndexable (docType)) {
        asyncCb (null, null);

      } else if (indexingHandler.getNumberOfIndexTriesForCurrentVersion (currentIndexState)  > constants.MAX_INDEXING_ATTEMPTS) {
        //TODO: this property is better kept on the original attachmentInfo or linkInfo so we don't try 3x per instance if it fails
        asyncCb (null, null);
      } else {

        // get the file from s3
        cloudStorageUtils.getFile (resourcePath, useGzip, inAzure, function (err, res) {
          if (err) {
            asyncCb (winston.makeError ('Indexing handler: error getting file from s3', {err : err, resourcePath : resourcePath}));
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

exports.updateAttOrLinkIndexState = function( attOrLink, isLink, esUtilsError, callback ) {

  if ( ! attOrLink ) { callback( winston.makeMissingParamError('attOrLink') ); return; }
  if ( typeof isLink === 'undefined' ) { callback( winston.makeMissingParamError('isLink') ); return; }

  var arrIndex = -1;

  // check length of index array and find the appropriate version
  if (attOrLink && attOrLink.index && attOrLink.index.length) {
    arrIndex = indexingHandler.getArrayIndexForVersion (attOrLink.index, esConnect.indexName);
  } 

  if (arrIndex == -1) {
    // create a new entry
    var indexState = {
      version : esConnect.indexName
    };

    var length = attOrLink.index.push (indexState);
    arrIndex = length - 1;
  }

  if (esUtilsError) {
    attOrLink.index [arrIndex].indexState = 'softFail';
    attOrLink.index [arrIndex].tries += 1;
  } else {
    attOrLink.index [arrIndex].indexState = 'done';
    attOrLink.index [arrIndex].tries += 1;
  }

  attOrLink.save (function (err) {
    if ( err ) { 
      callback ( winston.makeMongoError(err) );
    }
    else {
      if (!esUtilsError) {
        callback ();
      }
      else if (attOrLink.index [arrIndex].tries > constants.MAX_INDEXING_ATTEMPTS) {
        esUtilsError.deleteFromQueue = true;
        var logData = {
          attOrLinkId : attOrLink._id,
          isLink : isLink,
          err : esUtilsError
        };

        callback (winston.makeError ('failed indexing too many times, deleting job from queue', logData));
      }
    }
  });

}


exports.getNumberOfIndexTriesForCurrentVersion = function (indexStateArray) {
  var arrIndex = indexingHandler.getArrayIndexForVersion (indexStateArray, esConnect.indexName);
  if (arrIndex === -1) {
    return 0;
  } else {
    return indexStateArray[arrIndex].tries;
  }

}

exports.getArrayIndexForVersion = function (indexStateArray, indexName) {
  for (var i = 0; i < indexStateArray.length; i++) {
    if (indexStateArray[i].version == indexName) {
      return i;
    }
  }
  return -1;
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


exports.getIndexDataForDocument = function (attOrLink, resourceBuffer, mail, isLink) {

  var emailBody = mail.bodyText;

  if (!mail.bodyText) {
    emailBody = mail.bodyHTML
  }

  var recipientNames;
  var recipientEmails;
  var authorName;
  var authorEmail;

  if (attOrLink && attOrLink.recipients) {
    recipientNames = attOrLink.recipients.map (function (rec) { return rec.name});
    recipientEmails = attOrLink.recipients.map (function (rec) { return rec.email});
  }

  if (attOrLink && attOrLink.sender) {
    authorName = attOrLink.sender.name;
    authorEmail = attOrLink.sender.email;
  }

  var indexData = {
    authorName : authorName,
    authorEmail : authorEmail,
    authorEmailKey : authorEmail,
    recipientNames : recipientNames,
    recipientEmails : recipientEmails,
    recipientEmailsKey : recipientEmails,
    userId : attOrLink.userId,
    emailBody: emailBody,
    emailSubject: attOrLink.mailCleanSubject,
    mailId : mail._id,
    date : attOrLink.sentDate.getTime()
  }


  if (resourceBuffer) {
    indexData.file = resourceBuffer.toString('base64');
  }

  if (isLink) {
    indexData.url = attOrLink.url;
    indexData.isLink = true;
  } else {
    indexData.filename = attOrLink.filename;
    indexData.isLink = false;
    indexData.isImage = attOrLink.isImage;
    indexData.size = attOrLink.fileSize;
    indexData.docType = attOrLink.docType;
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