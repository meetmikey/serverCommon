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

exports.indexAttachment = function(attachment, attachmentBytes, mail, callback) {
  var fileContentId = attachmentUtils.getFileContentId( attachment );
  winston.doInfo('indexing attachment: ' + fileContentId);

  indexingHandler.indexResource (attachment, attachmentBytes.content, fileContentId, false, function (err) {
    if (err) { return callback (winston.doError ('Could not index resource', err)); }

    indexingHandler.indexResourceMetadata (attachment, mail, fileContentId, false, function (err) {
      if (err) { return callback (winston.doError ('Could not index attachment metadata', err)); }

      callback ();
    })
  })

}

exports.indexResource = function (resource, resourceBytes, resourceId, isLink, callback) {
  //winston.info ('indexResource', resourceId)
  var indexData = indexingHandler.getIndexDataForResource (resource, resourceBytes, isLink);

  var shardKey = '';
  if ( ! isLink ) {
    shardKey = mongoUtils.getShardKeyHash( resource.userId );
  }

  esUtils.index( esConnect.indexName, 'resource', resourceId, indexData, null,
    function( esUtilsErr ) {
      if ( esUtilsErr ) {
        if ( isLink ) {
          indexingHandler.markFailStatusForLinkInfo( resourceId, esUtilsErr.message );
        } else {
          indexingHandler.markFailStatusForAttachment( resource.hash, shardKey, esUtilsErr.message );
        }

      } else {
        if ( isLink ) {
          indexingHandler.markSuccessStatusForLinkInfo( resourceId );
        } else {
          indexingHandler.markSuccessStatusForAttachment( resource.hash, shardKey );
        }
      }
    }
  );
}

exports.updateCallback = function (err, num) {
  if (err) { 
    var logData = {err: err};
    winston.doError ("Could not update indexState for ", logData);
  }
  else if (num == 0) {
    winston.doError ("Zero records affected when updating indexState");
  }
  else {
    winston.info ('updated indexState');
  }
}

exports.markFailStatusForAttachment = function (hash, shardKey, error) {
  AttachmentModel.update ({hash : hash, shardKey: shardKey},
    {$set : {indexState : "error", indexError : error}}, indexingHandler.updateCallback);
}

exports.markFailStatusForLinkInfo = function (comparableURLHash, error) {
  LinkInfoModel.update ({comparableURLHash : comparableURLHash},
   {$set : {indexState : "error", indexError : error}}, indexingHandler.updateCallback);
}

exports.markSuccessStatusForAttachment = function (hash, shardKey) {
  AttachmentModel.update ({hash : hash, shardKey: shardKey},
    {$set : {indexState : "done"}}, indexingHandler.updateCallback);
}

exports.markSuccessStatusForLinkInfo = function (comparableURLHash) {
  LinkInfoModel.update ({comparableURLHash : comparableURLHash}, 
    {$set : {indexState : "done"}}, indexingHandler.updateCallback);
}


// resource here is either an attachment or link
exports.indexResourceMetadata = function (resource, mail, parentId, isLink, callback) {
  //winston.doInfo ('indexResourceMetadata', {resourceId : resource._id});
  var indexData = indexingHandler.getIndexDataForResourceMeta (resource, isLink, mail);

  if ( ! mail.indexable ) {
    indexingHandler.setMailIndexable( mail );
  }

  esUtils.index( esConnect.indexName, 'resourceMeta', String(resource._id), indexData, parentId
    , function( esUtilsErr ) {
      if ( esUtilsErr ) {
        indexingHandler.setIndexStateForMetadata( resource, esUtilsErr.message );

      } else {
        indexingHandler.setIndexStateForMetadata( resource );
      }
      callback();
    }
  );
}


exports.setIndexStateForMetadata = function (resource, error) {
  if (error) {
    if (resource.hash) { 
      indexingHandler.markFailStatusForAttachmentMeta (resource._id, error);
    }
    else {
      indexingHandler.markFailStatusForLinkMeta (resource._id, error);
    }
  }
  else {
    if (resource.hash) { 
      indexingHandler.markSuccessStatusForAttachmentMeta (resource._id);
    }
    else {
      indexingHandler.markSuccessStatusForLinkMeta (resource._id);
    }
  }
}

exports.markFailStatusForAttachmentMeta = function (attachmentId, error) {
  AttachmentModel.update ({_id : attachmentId},
    {$set : {metaIndexState : "error", metaIndexError : error}},
    {multi : false},
    indexingHandler.updateCallback);
}

exports.markFailStatusForLinkMeta = function (linkId, error) {
  LinkModel.update ({_id : linkId},
    {$set : {metaIndexState : "error", metaIndexError : error}}, 
    {multi : false},
    indexingHandler.updateCallback);
}

exports.markSuccessStatusForAttachmentMeta = function (attachmentId) {
  AttachmentModel.update ({_id : attachmentId},
    {$set : {metaIndexState : "done"}}, 
    {multi : false},
    indexingHandler.updateCallback);
}

exports.markSuccessStatusForLinkMeta = function (linkId) {
  LinkModel.update ({_id : linkId},
    {$set : {metaIndexState : "done"}}, 
    {multi : false},
    indexingHandler.updateCallback);
}


exports.setMailIndexable = function( mail ) {

  if ( ! mail ) { winston.doMissingParamError('mail'); return; }

  MailModel.update ({_id : mail._id}, {$set : {indexable : true}}, function( err, num ) {
    if (err) { 
      var logData = {mailId : mail._id, err: err};
      winston.doError ("Could not update indexable ", logData);

    } else if (num === 0) {
      var logData = {mailId : mail._id};
      winston.doWarn ("Zero records affected when updating indexable", logData);
    }
  });
}

exports.updateResourceMetadata = function (resource, mail, resourceId, isLink, callback) {
  indexingHandler.indexResourceMetadata (resource, mail, resourceId, isLink, callback)
}

exports.generateResourceId = function (attachment) {
  return attachment.hash + '_' + attachment.fileSize
}

exports.getIndexDataForResourceMeta = function (resource, isLink, mail) {
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
    
    if (!resource.isImage) {
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
