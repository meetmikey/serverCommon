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

  var job = indexingHandler.getIndexingJobForDocument( model, isLink );
  if ( ! job ) {
    callback( winston.makeError('no job') );
  } else {
    indexingHandler.pushJobToQueue( job, isReindexing, callback );
  }
}

exports.getIndexingJobForDocument = function( model, isLink ) {

  if ( ! model ) { winston.doMissingParamError('model'); return null; }
  if ( typeof isLink == 'undefined' ) { winston.doMissingParamError('isLink'); return null; }

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
    resourceId : String (resourceId),
    isLink : isLink,
    modelId : String (model._id),
    mailId : String (model.mailId),
    modelName : modelName
  };
  return job;
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
    } else if (String (foundAttOrLink.mailId) != String (mailId)) {
      winston.doWarn ('Not indexing document because mailId has changed so job is stale', {currentId : foundAttOrLink.mailId, jobId : mailId});
      callback ();
    } else {
      indexingHandler.getMailAndResource (isLink, mailId, mailPath, resourcePath, foundAttOrLink.docType, foundAttOrLink.index, function (err, response) {
        if (err) {
          callback (err);
        } else {
          var mailObj = response [0];
          var resourceBuffer = response [1];
          var asStub = !resourceBuffer;

          var indexData = indexingHandler.getIndexDataForDocument( foundAttOrLink, resourceBuffer, mailObj, isLink );
          var parentId = null;

          esUtils.index( esUtils.getIndexAliasForUser (foundAttOrLink.userId), 'document', modelId, indexData, parentId,
            function( esUtilsError ) {
              if (esUtilsError && esUtils.isHardFail (esUtilsError.message)) {
                winston.doWarn ('Bad response from es, indexing as stub', {modelId : modelId});
                indexingHandler.indexResourceAsStub (foundAttOrLink, modelId, mailObj, isLink, callback);
              } else {
                indexingHandler.updateAttOrLinkIndexState( foundAttOrLink, isLink, esUtilsError, asStub, callback );
              }
            }
          );

        }
      });
    }
  });

}


exports.indexResourceAsStub = function (foundAttOrLink, modelId, mailObj, isLink, callback) {
  var indexData = indexingHandler.getIndexDataForDocument( foundAttOrLink, null, mailObj, isLink );
  var parentId = null;
  var asStub = true;

  esUtils.index( esUtils.getIndexAliasForUser (foundAttOrLink.userId), 'document', modelId, indexData, parentId,
    function( esUtilsError ) {
      indexingHandler.updateAttOrLinkIndexState( foundAttOrLink, isLink, esUtilsError, asStub, callback );
    }
  );
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
          if (err.extra && err.extra.type == "404") {
            winston.doError ('Mail body is not in s3!!', {err : err, path : mailPath});
            var mail = {
              _id : mailId
            };
            asyncCb (null, mail);
          }
          else {
            asyncCb (winston.makeError ('Indexing handler: error getting file from s3', {err : err, path : mailPath}));
          }
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
                };
                
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
        // TODO: this property is better kept on the original attachmentInfo or linkInfo so we don't try 3x per instance if it fails
        // TODO : test this path in code
        asyncCb (null, null);

      } else {

        // get the file from s3
        cloudStorageUtils.getFile (resourcePath, useGzip, inAzure, function (err, res) {
          if (err) {
            if (err.extra && err.extra.type == "404") {
              // file doesn't exist for some reason, index as stub
              winston.doWarn ('indexingHandler: file not in s3', {err : err, resourcePath: resourcePath});
              asyncCb (null, null);
            } else {
              asyncCb (winston.makeError ('Indexing handler: error getting file from s3', {err : err, resourcePath : resourcePath}));
            }
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

exports.updateAttOrLinkIndexState = function( attOrLink, isLink, esUtilsError, asStub, callback ) {

  if ( ! attOrLink ) { callback( winston.makeMissingParamError('attOrLink') ); return; }
  if ( typeof isLink === 'undefined' ) { callback( winston.makeMissingParamError('isLink') ); return; }

  var arrIndex = -1;

  // check length of index array and find the appropriate version
  if (attOrLink && attOrLink.index && attOrLink.index.length) {
    arrIndex = indexingHandler.getArrayIndexForVersion (attOrLink.index, esConnect.indexName);
  } 

  if (arrIndex == -1) {
    // create a new entry if it doesn't exist
    var indexState = {
      version : esConnect.indexName
    };

    var length = attOrLink.index.push (indexState);
    arrIndex = length - 1;
  }

  var hardFail = false;

  if (esUtilsError) {
    if (esUtils.isHardFail (esUtilsError.message)) {
      attOrLink.index [arrIndex].indexState = 'hardFail';
      attOrLink.index [arrIndex].tries += 1;
      hardFail = true;
    }
    else {
      attOrLink.index [arrIndex].indexState = 'softFail';
      attOrLink.index [arrIndex].tries += 1;      
    }
  } 
  else {
    attOrLink.index [arrIndex].indexState = 'done';
    attOrLink.index [arrIndex].tries += 1;

    if (asStub) {
      attOrLink.index [arrIndex].asStub = asStub;      
    }

  }

  attOrLink.save (function (err) {
    if ( err ) { 
      callback ( winston.makeMongoError(err) );
    }
    else {
      if (!esUtilsError) {
        callback ();
      }
      else if (attOrLink.index [arrIndex].tries > constants.MAX_INDEXING_ATTEMPTS || hardFail) {
        esUtilsError.deleteFromQueue = true;
        var logData = {
          attOrLinkId : attOrLink._id,
          isLink : isLink,
          err : esUtilsError,
          hardFail : hardFail
        };

        callback (winston.makeError ('failed indexing too many times, deleting job from queue', logData));
      }
      else {
        var logData = {
          attOrLinkId : attOrLink._id,
          isLink : isLink,
          err : esUtilsError
        };

        callback (winston.makeError ('failed indexing but not deleting from queue', logData));
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


exports.getDefaultUpdateSet = function () {
  return { $set: { 'index.indexState': 'done', 'index.version' : esConnect.indexName },
           $inc : { 'index.tries' : 1 } };
}


exports.getIndexDataForDocument = function (attOrLink, resourceBuffer, mail, isLink) {

  var emailBody;

  if (mail && mail.bodyText) {
    emailBody = mail.bodyText;
  }
  else if (mail && mail.bodyHTML) {
    emailBody = mail.bodyHTML;
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
    emailSubject: attOrLink.mailCleanSubject,
    mailId : mail._id,
    date : attOrLink.sentDate.getTime()
  }


  if (emailBody) {
    indexData.emailBody = emailBody;
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