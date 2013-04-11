var serverCommon = process.env.SERVER_COMMON;

var conf = require(serverCommon + '/conf')
  , mongoUtils = require(serverCommon + '/lib/mongoUtils')
  , winston = require (serverCommon + '/lib/winstonWrapper').winston
  , esUtils = require (serverCommon + '/lib/esUtils')
  , attachmentUtils = require (serverCommon + '/lib/attachmentUtils')
  , esConnect = require ('./esConnect')
  , AttachmentModel = require(serverCommon + '/schema/attachment').AttachmentModel
  , LinkInfoModel = require(serverCommon + '/schema/linkInfo').LinkInfoModel
  , LinkModel = require (serverCommon + '/schema/link').LinkModel
  , MailModel = require(serverCommon + '/schema/mail').MailModel;

var indexingHandler = this;


/*
  Attachment-specific functions
  -------------------------------------------------------
*/

exports.doIndexingJob = function ( job, callback ) {
  // TODO:
}
 
exports.indexAttachment = function( attachment, mail ) {
  var parentId = attachmentUtils.getFileContentId( attachment );
  indexingHandler.indexResourceMetadata( attachment, mail, parentId, false );
}

exports.updateAttachment = function( attachment, mail, resourceId ) {
  var parentId = attachmentUtils.getFileContentId( attachment );
  indexingHandler.updateResourceMetadata( attachment, mail, parentId, false );
}

exports.indexAttachmentFile = function( attachment, parsedMailAttachment ) {
  var resourceId = attachmentUtils.getFileContentId( attachment );
  var resourceBytes = parsedMailAttachment.content;
  indexingHandler.indexResource( attachment, resourceBytes, resourceId, false );
}

exports.indexAttachmentAndFile = function( attachment, parsedMailAttachment, mail ) {
  indexingHandler.indexAttachmentFile( attachment, parsedMailAttachment );
  indexingHandler.indexAttachment( attachment, mail );
}

exports.updateAttachmentFileIndexState = function( attachment, esUtilsError ) {
  
  if ( ! attachment ) { winston.doMissingParamError('attachment'); return; }
  if ( ! attachment.hash ) { winston.doMissingParamError('attachment.hash'); return; }
  if ( ( ! attachment.fileSize ) && ( attachment.fileSize !== 0 ) ) { winston.doMissingParamError('attachment.fileSize'); return; }

  var filter = {
      hash: attachment.hash
    , fileSize: attachment.fileSize
  };

  var updateSet = {$set:{
    fileIndexState: 'done'
  }};

  if ( esUtilsError ) {
    var fileIndexState = 'softFail';
    if ( esUtilsError.errorType && ( esUtilsError.errorType == esUtils.ERROR_TYPE_BAD_RESPONSE ) ) {
      //These errors seem to indicate that this resource is not ES-compatible, so not worth re-trying.
      fileIndexState = 'hardFail';
    }
    updateSet['$set']['fileIndexState'] = fileIndexState;
    //updateSet['$set']['fileIndexError'] = esUtilsError.message;
  }

  var options = {
    multi: true
  };

  AttachmentModel.update( filter, updateSet, options, indexingHandler.updateIndexStateCallback );
}




/*
  Link-specific functions
  -------------------------------------------------------
*/

exports.indexLink = function( link, mail ) {
  var parentId = link.comparableURLHash;
  indexingHandler.indexResourceMetadata( link, mail, parentId, true );
}

exports.updateLink = function( link, mail ) {
  var parentId = link.comparableURLHash;
  indexingHandler.updateResourceMetadata( link, mail, parentId, true );
}

exports.indexLinkInfo = function( linkInfo, linkFollowData ) {
  indexingHandler.indexResource( linkInfo, linkFollowData, linkInfo.comparableURLHash, true );
}

exports.updateLinkInfoIndexState = function( linkInfo, esUtilsError ) {

  if ( ! linkInfo ) { winston.doMissingParamError('linkInfo'); return; }
  if ( ! linkInfo.comparableURLHash ) { winston.doMissingParamError('linkInfo.comparableURLHash'); return; }

  var filter = {
    comparableURLHash : linkInfo.comparableURLHash
  };

  var updateSet = {$set:{
    indexState: 'done'
  }};

  if ( esUtilsError ) {
    var indexState = 'softFail';
    if ( esUtilsError.errorType && ( esUtilsError.errorType == esUtils.ERROR_TYPE_BAD_RESPONSE ) ) {
      //These errors seem to indicate that this resource is not ES-compatible, so not worth re-trying.
      indexState = 'hardFail';
    }
    updateSet['$set']['indexState'] = indexState;
    //updateSet['$set']['indexError'] = esUtilsError.message;
  }

  var options = {
    multi: false
  };

  LinkInfoModel.update( filter, updateSet, options, indexingHandler.updateIndexStateCallback );
}





/*
  Generic functions
  -------------------------------------------------------
*/

exports.indexResource = function( resource, resourceBytes, resourceId, isLinkInfo, optionalCallback ) {

  if ( ! resource ) { winston.doMissingParamError('resource'); return; }
  if ( ! resourceBytes ) { winston.doMissingParamError('resourceBytes'); return; }
  if ( ! resourceId ) { winston.doMissingParamError('resourceId'); return; }
  if ( typeof isLinkInfo == 'undefined' ) { winston.doMissingParamError('isLinkInfo'); return; }

  //winston.doInfo('indexResource', resourceId);
  var indexData = indexingHandler.getIndexDataForResource( resource, resourceBytes, isLinkInfo );
  var parentId = null;

  esUtils.index( esConnect.indexName, 'resource', resourceId, indexData, parentId,
    function( esUtilsError ) {
      if ( isLinkInfo ) {
        indexingHandler.updateLinkInfoIndexState( resource, esUtilsError );

        if (optionalCallback) {
          optionalCallback (esUtilsError);
        }
      } else { //AttachmentFile
        indexingHandler.updateAttachmentFileIndexState( resource, esUtilsError );

        if (optionalCallback) {
          optionalCallback (esUtilsError);
        }
      }
    }
  );
}

// resourceMetadata here is either an attachment or link
exports.indexResourceMetadata = function( resourceMetadata, mail, parentId, isLink ) {

  if ( ! resourceMetadata ) { winston.doMissingParamError('resourceMetadata'); return; }
  if ( ! mail ) { winston.doMissingParamError('mail'); return; }
  if ( ! parentId ) { winston.doMissingParamError('parentId'); return; }

  //winston.doInfo('indexResourceMetadata', {resourceId : resourceMetadata._id});
  var indexData = indexingHandler.getIndexDataForResourceMetadata( resourceMetadata, isLink, mail );

  if ( ! mail.indexable ) {
    indexingHandler.setMailIndexable( mail );
  }

  esUtils.index( esConnect.indexName, 'resourceMeta', String(resourceMetadata._id), indexData, parentId,
    function( esUtilsError ) {
      var model = AttachmentModel;
      if ( isLink ) {
        model = LinkModel;
      }
      indexingHandler.updateResourceMetadataIndexState( resourceMetadata, model, esUtilsError );
    }
  );
}

exports.updateResourceMetadata = function( resource, mail, parentId, isLink ) {
  indexingHandler.indexResourceMetadata( resource, mail, parentId, isLink );
}

exports.updateResourceMetadataIndexState = function( resourceMetadata, model, esUtilsError ) {

  if ( ! resourceMetadata ) { winston.doMissingParamError('resourceMetadata'); return; }
  if ( ! model ) { winston.doMissingParamError('model'); return; }
  if ( ! resourceMetadata.userId ) { winston.doMissingParamError('resourceMetadata.userId'); return; }

  var shardKey = mongoUtils.getShardKeyHash( resourceMetadata.userId );
  if ( ! shardKey ) { winston.doMissingParamError('shardKey'); return; }

  var filter = {
      _id : resourceMetadata._id
    , shardKey: shardKey
  };

  var updateSet = {$set:{
    indexState: 'done'
  }};

  if ( esUtilsError ) {
    var indexState = 'softFail';
    if ( esUtilsError.errorType && ( esUtilsError.errorType == esUtils.ERROR_TYPE_BAD_RESPONSE ) ) {
      //These errors seem to indicate that this resource is not ES-compatible, so not worth re-trying.
      indexState = 'hardFail';
    }
    updateSet['$set']['indexState'] = indexState;
    //updateSet['$set']['indexError'] = esUtilsError.message;
  }

  var options = {
    multi: false
  };

  model.update( filter, updateSet, options, indexingHandler.updateIndexStateCallback );
}

exports.updateIndexStateCallback = function( mongoErr, numAffected ) {
  if ( mongoErr ) { 
    winston.doMongoError(mongoErr);
  
  } else if ( numAffected == 0 ) {
    winston.doError('Zero records affected when updating indexState');

  } else {
    //winston.doInfo('updated indexState');
  }
}

exports.setMailIndexable = function( mail ) {

  if ( ! mail ) { winston.doMissingParamError('mail'); return; }
  if ( ! mail.userId ) { winston.doMissingParamError('mail.userId'); return; }

  var shardKey = mongoUtils.getShardKeyHash( mail.userId );
  if ( ! shardKey ) { winston.doMissingParamError('shardKey'); return; }

  var filter = {
      _id: mail._id
    , shardKey: shardKey
  };

  var updateSet = {$set: {
    indexable: true
  }};

  MailModel.update( filter, updateSet, function( mongoErr, numAffected ) {
    if ( mongoErr ) {
      winston.doMongoError( mongoErr, {mailId : mail._id} );

    } else if ( numAffected === 0 ) {
      winston.doWarn('Zero records affected when updating mail.indexable', {mailId : mail._id});
    }
  });
}

exports.getIndexDataForResourceMetadata = function( resource, isLink, mail ) {
  var emailBody = mail.bodyText;

  if (!mail.bodyText) {
    emailBody = mail.bodyHTML
  }

  var recipientNames = mail.recipients.map (function (rec) { return rec.name})
  var recipientEmails = mail.recipients.map (function (rec) { return rec.email})

  var indexData = {
    authorName : mail.sender.name,
    authorEmail : mail.sender.email,
    recipientNames : recipientNames,
    recipientEmails : recipientEmails,
    userId : mail.userId,
    emailBody: emailBody,
    emailSubject: mail.cleanSubject,
    mailId : mail._id,
    date : mail.gmDate
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
