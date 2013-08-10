
var async = require('async')
  , winston = require('./winstonWrapper').winston
  , conf = require('../conf')
  , constants = require('../constants')
  , utils = require('./utils')
  , urlUtils = require('./urlUtils')
  , webUtils = require('./webUtils')
  , imageUtils = require ('./imageUtils')
  , googleUtils = require('./googleUtils')
  , mongoUtils = require('./mongoUtils')
  , cloudStorageUtils = require('./cloudStorageUtils')
  , indexingHandler = require('./indexingHandler')
  , diffbot = require('./diffbotWrapper').diffbot
  , sqsConnect = require ('./sqsConnect')
  , LinkModel = require('../schema/link').LinkModel
  , LinkInfoModel = require('../schema/linkInfo').LinkInfoModel
  , LinkDomainResultModel = require('../schema/linkDomainResult').LinkDomainResultModel

var followLinkUtils = this;

exports.createFollowLinkJob = function(isQuick, linkInfo, userId, callback ) {

  if ( ! linkInfo ) { winston.doMissingParamError('linkInfo'); return; }
  if ( ! userId ) { winston.doMissingParamError('userId'); return; }

  var job = {
      jobType: 'followLink'
    , linkInfoId: linkInfo._id
    , userId: userId
    , isQuick : isQuick
  }

  var queueAddFunction = sqsConnect.addMessageToWorkerQueue;

  if (isQuick) {
    queueAddFunction = sqsConnect.addMessageToWorkerQuickQueue;
  }

  queueAddFunction( job, function( err ) {
    if ( err ) {
      if ( callback ) {
        callback( winston.makeError('Could not add followLink job to worker queue', {job : job}) );
      } else {
        winston.doError('Could not add followLink job to worker queue', {job : job});
      }

    } else {
      if ( callback ) {
        callback();
      }
    }
  });
}

exports.doFollowLinkJob = function( job, callback ) {

  //winston.doInfo('followLinkUtils: doFollowLinkJob');

  if ( ( ! job ) || ( job.jobType != 'followLink' ) ) {
    callback( winston.makeError('invalid or missing job') );

  } else {
    followLinkUtils.getLinkInfoFromJob( job, function(err, linkInfo) {
      if ( err ) {
        callback( err );

      } else {
        var userId = job.userId;
        followLinkUtils.followLinkSaveUploadIndexAndUpdateLinks( job, linkInfo, userId, callback );
      }
    });
  }
}

exports.getLinkInfoFromJob = function( job, callback ) {

  if ( ! job ) { callback( winston.makeMissingParamError('job') ); return; }
  if ( ! job.linkInfoId ) { callback( winston.makeMissingParamError('job.linkInfoId') ); return; }

  LinkInfoModel.findById( job.linkInfoId, function(err, linkInfo) {
    if ( err ) {
      callback( winston.makeMongoError(err) );

    } else if ( ! linkInfo ) {
      callback( winston.makeError('followLink job: no linkInfo with id', {linkInfoId: job.linkInfoId}) );

    } else {
      callback( null, linkInfo );
    }
  });
}

exports.followLinkSaveUploadIndexAndUpdateLinks = function( message, linkInfo, userId, callback ) {

  if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }
  if ( ! userId ) { callback( winston.makeMissingParamError('userId') ); return; }
  //winston.doInfo('followLinkUtils: followLinkSaveUploadIndexAndUpdateLinks');

  if (utils.containsSubstringFromArray( linkInfo.rawURL, constants.URL_FILTER_TEXT )) {

    // just set linkinfo state to ignored... move on
    linkInfo.followType = 'ignore';

    winston.doWarn ('Ignoring link due to text match of filter text', {url : linkInfo.rawURL});

    linkInfo.save (function (err) {
      if (err) {
        callback (winston.makeMongoError (err));
      } else {
        callback ();
      }
    });

  } else {

    followLinkUtils.followLinkSaveAndUpload( message, linkInfo, userId, function( err, linkFollowData ) {
      if ( err ) {
        callback( err );

      } else if ( linkInfo.followType == 'fail' ) {
        //No need to index, no need to update links.
        winston.doWarn('followLinkUtils: followLinkAndIndex: link following failed, not indexing', {linkInfoId: linkInfo._id});
        followLinkUtils.saveLinkInfoAndCallback (linkInfo, callback);

      } else {
        followLinkUtils.updateAndIndexLinks( message, linkInfo, callback );
      }
    });
  }
}

exports.followLinkSaveAndUpload = function( message, linkInfo, userId, callback ) {

  //winston.doInfo('followLinkUtils: followLinkSaveAndUpload...', {linkInfoId: linkInfo._id});

  linkInfo.lastFollowDate = new Date();
  linkInfo.followType = 'fail'; //Start with fail, update to success.
  var url = followLinkUtils.getRealURL( linkInfo );
  followLinkUtils.checkAndFollowLink( message, linkInfo, userId, function( err, linkFollowData, mimeType ) {
    if ( err ) {
      callback( err );

    } else if ( ! linkFollowData ) {
      var warnData = {followType: linkInfo.followType, url: url};
      winston.doWarn('followLinkUtils: followLinkSaveAndUpload: empty linkFollowData', warnData);
      linkInfo.followType = 'fail';
      //No data here, so nothing to index, don't need to update the linkInfo (nothing's changed)
      // and don't need to update the links (since we didn't succeed).
      //Go ahead and delete this 'followLink' job from the queue.  We're done here.
      followLinkUtils.saveLinkInfoAndCallback (linkInfo, callback);

    } else if ( linkInfo.followType == 'fail' ) {
      winston.doWarn('followLinkUtils: followLinkSaveAndUpload: following failed', {url: url});

      //Link following failed, so nothing to index, don't need to update the linkInfo (nothing's changed)
      // and don't need to update the links (since we didn't succeed).
      //Go ahead and delete this 'followLink' job from the queue once we save the linkInfo.  We're done here.
      followLinkUtils.saveLinkInfoAndCallback (linkInfo, callback);

    } else {
      followLinkUtils.updateLinkInfoAfterFollowingLink( linkInfo, function( err ) {
        if ( err ) {
          callback( err );

        } else {
          followLinkUtils.uploadLinkInfoDataToCloud( linkInfo, linkFollowData, mimeType, function( err ) {
            if ( err ) {
              callback( err );

            } else {
              callback();
            }
          });
        }
      });
    }
  });
}

exports.saveLinkInfoAndCallback = function (linkInfo, callback) {
  linkInfo.save (function (err) {
    if (err) {
      callback (winston.makeMongoError (err));
    } else {
      callback ();
    }
  });
}

exports.uploadLinkInfoDataToCloud = function( linkInfo, cloudData, mimeType, callback ) {

  if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }
  if ( ! cloudData ) { callback( winston.makeMissingParamError('cloudData') ); return; }
  if ( ! mimeType ) { callback( winston.makeMissingParamError('mimeType') ); return; }

  //winston.doInfo('followLinkUtils: uploadLinkInfoDataToCloud...', {linkInfoId: linkInfo._id});

  var cloudPath = cloudStorageUtils.getLinkInfoPath( linkInfo );
  var headers = {
    'Content-Type': mimeType
  }
  var useGzip = true;
  var useAzure = false;

  cloudStorageUtils.putBuffer( cloudData, cloudPath, headers, useGzip, useAzure, function(err) {
    if ( err ) {
      var query = {_id : linkInfo._id};
      cloudStorageUtils.markFailedUpload (LinkInfoModel, 'linkInfo', query);
      callback( err );
    } else {
      callback();
    }
  });
}

exports.checkAndFollowLink = function( message, linkInfo, userId, callback ) {
  
  if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }
  var url = followLinkUtils.getRealURL( linkInfo );
  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  followLinkUtils.checkURLDomain( url, function(err, urlDomainIsOK) {
    if ( err ) {
      callback(err);

    } else if ( ! urlDomainIsOK ) {
      linkInfo.isBadDomain = true;
      winston.doWarn('followLinkUtils: checkAndFollowLink: url domain is bad, not following', {url: url});
      callback();

    } else {
      followLinkUtils.followLink( message, linkInfo, userId, function( followLinkErr, linkFollowData, mimeType ) {
        var isSuccess = true;
        if ( followLinkErr || ( ! linkFollowData ) || ( linkInfo.followType == 'fail' ) ) {
          isSuccess = false;
        }
        followLinkUtils.recordURLDomainResult( url, isSuccess, function(err) {
          if ( err ) {
            callback(err);

          } else {
            callback( followLinkErr, linkFollowData, mimeType );
          }
        });
      });
    }
  });
}

exports.checkURLDomain = function( url, callback ) {
  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }
  var domain = urlUtils.getHostname(url);
  if ( ! domain ) { callback( winston.makeMissingParamError('domain') ); return; }

  LinkDomainResultModel.findOne({domain:domain}, function(err, foundLinkDomainResult) {
    if ( err ) {
      callback( winston.makeMongoError(err) );

    } else if ( ! foundLinkDomainResult ) {
      callback( null, true );

    } else {
      var isDomainOK = true;

      var domainWhitelist = constants.LINK_DOMAIN_WHITELIST;
      if ( domainWhitelist.indexOf(domain) == -1 ) {

        var failCount = foundLinkDomainResult.failCount;
        if ( failCount && ( failCount > constants.MIN_DOMAIN_FAILS ) ) {

          var successCount = 0;
          if ( foundLinkDomainResult.successCount ) {
            successCount = foundLinkDomainResult.successCount;
          }
          var successRatio = successCount / failCount;
          
          if ( successRatio < constants.MIN_DOMAIN_SUCCESS_RATIO ) {
            isDomainOK = false;
          }
        }
      }

      callback( null, isDomainOK );
    }
  });
}

exports.recordURLDomainResult = function( url, isSuccess, callback ) {
  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }
  var domain = urlUtils.getHostname(url);
  if ( ! domain ) { callback( winston.makeMissingParamError('domain') ); return; }

  var increment = {$inc:{}};
  if ( isSuccess ) {
    increment['$inc'] = {successCount: 1};
  } else {
    increment['$inc'] = {failCount: 1};
  }

  var options = {
    upsert: true
  }

  LinkDomainResultModel.findOneAndUpdate( {domain: domain}, increment, options, function(err, updatedURLDomainResult) {
    if ( err ) {
      callback( winston.makeMongoError(err) );

    } else if ( ! updatedURLDomainResult ) {
      callback( winston.makeError('failed to get updatedURLDomainResult') );

    } else {
      //winston.doInfo('ok!', {updatedURLDomainResult: updatedURLDomainResult});
      callback();
    }
  });
}

exports.followLink = function( message, linkInfo, userId, callback ) {

  if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }
  var url = followLinkUtils.getRealURL( linkInfo );
  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  //winston.doInfo('followLinkUtils: followLink...', {url: url, linkInfoId: linkInfo._id});

  if ( urlUtils.isPDF(url) ) {
    followLinkUtils.followPDFLink(linkInfo, callback);

  } else if ( urlUtils.isGoogleDoc(url) ) {
    followLinkUtils.followGoogleDocLink( message, linkInfo, userId, callback );

  } else { // a normal url we send to diffbot
    followLinkUtils.followDiffbotLink(message, linkInfo, callback );
  }
}

exports.followDiffbotLink = function( message, linkInfo, callback ) {


  if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }
  var url = followLinkUtils.getRealURL( linkInfo );
  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  //winston.doInfo('followLinkUtils: followDiffbotLink...', {url: url, linkInfoId: linkInfo._id});

  var diffbotData = {
      uri: url
    , summary: true
    , tags: false
    , stats: true
  }

  try {
    diffbot.article( diffbotData, function(err, response) {
      if ( err || ( ! response ) || ( response.errorCode ) ) {
        var warnData = {err: err, response: response, url: url};
        if ( response ) {
          warnData['responseErrorCode'] = response.errorCode;
        }
        winston.doWarn('followLinkUtils: followDiffbotLink: diffbot failed', warnData);

        // dont need to try obvious error cases
        //if (followLinkUtils.isDiffbotResponseSuspicious (response)) {
        //  callback ();
        //} else {
        followLinkUtils.followLinkDirectly( linkInfo, callback );
        //}
      
      } else if  (followLinkUtils.isDiffbotResponseSuspicious (response)) {
        winston.doWarn('followLinkUtils: followDiffbotLink: diffbot suspicious data', 
          {title : response.title, summary : response.summary});
        followLinkUtils.followLinkDirectly( linkInfo, callback );

      } else {
        followLinkUtils.processDiffbotResponse( message, response, linkInfo, callback );
      }
    });
  } catch ( diffbotError ) {
    winston.doWarn('followLinkUtils: followDiffbotLink: diffbot threw an exception', {diffbotError: diffbotError, url: url});
    followLinkUtils.followLinkDirectly( linkInfo, callback );
  }
}

// this function exists because a redirect to a rendered 404 page
// then diffbot won't catch the 404 error and bad links show up
exports.isDiffbotResponseSuspicious = function (diffbotResponse) {
  if (!diffbotResponse || !diffbotResponse.title) {
    return true;
  }

  var title = diffbotResponse.title.toLowerCase();

  return ((title.indexOf ('404') != -1) || 
    (title.indexOf ('redirect') != -1) || 
    (title.indexOf ('page not found') != -1) ||
    (title.indexOf ('internal server error') != -1));

}

exports.processDiffbotResponse = function(message, diffbotResponse, linkInfo, callback) {

  //winston.doInfo('followLinkUtils: processDiffbotResponse...', {linkInfoId: linkInfo._id});

  if ( ! diffbotResponse ) { callback( winston.makeMissingParamError('diffbotResponse') ); return; }
  if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }

  var imageURL = followLinkUtils.getImageURLFromDiffbotResponse( diffbotResponse );

  var url = followLinkUtils.getRealURL( linkInfo );

  if ( urlUtils.isYoutubeURL( url ) ) {
    var youtubeImageURL = urlUtils.getYoutubeImageURL( url );
    if ( youtubeImageURL ) {
      imageURL = youtubeImageURL;
    }
  }

  if ( diffbotResponse.resolved_url ) {
    linkInfo.resolvedURL = diffbotResponse.resolved_url;
  }
  if ( diffbotResponse.title ) {
    linkInfo.title = diffbotResponse.title;
  }

  if ( diffbotResponse.summary ) {
    linkInfo.summary = diffbotResponse.summary;
  } else if ( diffbotResponse.text ) {
    linkInfo.summary = diffbotResponse.text.substring(0, constants.LINK_SUMMARY_CUTOFF);
  }

  followLinkUtils.addImageToLinkInfo( message, linkInfo, imageURL, function(err) {
    if ( err ) {
      winston.handleError ( err );

      winston.doInfo ('logging image follow failed for linkInfo', {_id : linkInfo._id});

      // mark that we couldn't get the image for future reprocessing
      linkInfo.imageFollowFailed = true;
      linkInfo.origImageURL = imageURL;
    } 

    var mimeType = 'text/html';
    var packagedDiffbotResponse = indexingHandler.packageDiffbotResponseInHTML( diffbotResponse );
    linkInfo.followType = 'diffbot';
    callback( null, packagedDiffbotResponse, mimeType );

  });
}

exports.getImageURLFromDiffbotResponse = function( diffbotResponse ) {
  var imageURL = null;
  if ( diffbotResponse.media && ( diffbotResponse.media.length > 0 ) ) {
    diffbotResponse.media.forEach(function (media) {
      if ( ( ! imageURL ) && ( media.primary == "true" ) && ( media.type == 'image' ) ) {
        imageURL = media.link;
      }
    });
  }
  return imageURL;
}

exports.followPDFLink = function( linkInfo, callback ) {

 if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }
  var url = followLinkUtils.getRealURL( linkInfo );
  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  //winston.doInfo('followLinkUtils: followPDFLink...', {linkInfoId: linkInfo._id});

  webUtils.webGet( url, true, function( err, responseBuffer ) {

      if ( err || ( ! responseBuffer ) ) {
        winston.doWarn('followLinkUtils: followPDFLink: error downloading pdf', {url: url, err: err});
        callback();
        
      } else {
        var mimeType = 'application/pdf';
        linkInfo.followType = 'pdf';
        callback( null, responseBuffer, mimeType );
      }
    }
  );
}

exports.followGoogleDocLink = function( message, linkInfo, userId, callback ) {

  if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }
  if ( ! userId ) { callback( winston.makeMissingParamError('userId') ); return; }
  var url = followLinkUtils.getRealURL( linkInfo );
  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  //winston.doInfo('followLinkUtils: followGoogleDocLink...', {linkInfoId: linkInfo._id});

  var googleDocId = urlUtils.extractGoogleDocId( url );
  if ( ! googleDocId ) {
    winston.doWarn('followLinkUtils: followGoogleDocLink: no googleDocId', {url: url});
    callback();
    return;
  }

  googleUtils.getAccessToken( userId, function(err, accessToken) {
    if ( err ) {
      callback( err );

    } else if ( ! accessToken ) {
      callback( winston.makeError('missing accessToken', {userId: userId, linkInfoId: linkInfo._id}) );

    } else {
      var docMetadataURL = conf.googleDriveAPIFileGetPrefix + googleDocId + '?access_token=' + accessToken;
      webUtils.webGet( docMetadataURL, true, function( err, responseBuffer ) {
        if ( err ) {
          var warnData = {err: err, linkInfoId: linkInfo._id};
          winston.doWarn('followLinkUtils: followGoogleDocLink: failed getting metadata', warnData);
          callback();

        } else if ( ! responseBuffer ) {
          var warnData = {linkInfoId: linkInfo._id};
          winston.doWarn('followLinkUtils: followGoogleDocLink: no responseBuffer', warnData);
          callback();

        } else {
          var docMetadata = responseBuffer.toString();
          followLinkUtils.getGoogleDocImageTitleSummaryAndData( message, linkInfo, docMetadata, accessToken,
            function( err, docData, mimeType ) {
              if ( err ) {
                callback(err);

              } else {
                if ( ! docData ) {
                  var warnData = {linkInfoId: linkInfo._id};
                  winston.doWarn('followLinkUtils: followGoogleDocLink: no docData from googleDoc', warnData);
                  callback();

                } else {
                  linkInfo.followType = 'googleDoc';
                  callback( null, docData, mimeType );
                }
              }
            }
          );
        }
      });
    }
  });
}

//callback expected arguments: function( err, docData, mimeType )
exports.getGoogleDocImageTitleSummaryAndData = function( message, linkInfo, docMetadataRaw, accessToken, callback ) {

  if ( ! docMetadataRaw ) { callback( winston.makeMissingParamError('docMetadataRaw') ); return; }
  if ( ! accessToken ) { callback( winston.makeMissingParamError('accessToken') ); return; }

  //winston.doInfo('followLinkUtils: getGoogleDocImageTitleSummaryAndData...', {linkInfoId: linkInfo._id});

  var docMetadata;

  try {
    docMetadata = JSON.parse( docMetadataRaw );
  } catch ( exception ) {
    callback( winston.makeError('failure parsing google doc metadata', {exception: exception}) );
    return;
  }

  //TODO: get doc thumbnail
  //See https://developers.google.com/drive/v2/reference/files#resource and look for thumbnailLink

  var thumbnailLink = docMetadata['thumbnailLink'];
  if ( thumbnailLink ) {
    if ( thumbnailLink.indexOf('?') === -1 ) {
      thumbnailLink += '?';
    } else {
      thumbnailLink += '&';
    }
    thumbnailLink += 'access_token=' + accessToken;
  }

  followLinkUtils.addImageToLinkInfo( message, linkInfo, thumbnailLink, function(err) {
    if ( err ) {
      winston.handleError(err);
      winston.doInfo('image follow failed for linkInfo', {_id : linkInfo._id});

      // mark that we couldn't get the image for future reprocessing
      linkInfo.imageFollowFailed = true;
      linkInfo.origImageURL = thumbnailLink;
    }

    var mimeType = '';
    linkInfo.title = docMetadata['title'];
    var exportLinks = docMetadata['exportLinks'];
    var exportLink = '';
    if ( exportLinks ) {
      if ( exportLinks['text/html'] ) {
        mimeType = 'text/html';
        exportLink = exportLinks['text/html'];

      } else if ( exportLinks['text/plain'] ) {
        mimeType = 'text/plain';
        exportLink = exportLinks['text/plain'];

      } else if ( exportLinks['application/pdf'] ) {
        mimeType = 'application/pdf';
        exportLink = exportLinks['application/pdf'];
      }
    }

    if ( ! exportLink ) {
      winston.doWarn('followLinkUtils: getGoogleDocTitleSummaryAndData: no valid export link', {linkInfoId: linkInfo._id})
      callback( null, null, mimeType );

    } else {
      if ( exportLink.indexOf('?') === -1 ) {
        exportLink += '?';
      } else {
        exportLink += '&';
      }
      exportLink += 'access_token=' + accessToken;

      webUtils.webGet( exportLink, true, function(err, responseBuffer) {
        if ( err ) {
          callback( err );

        } else if ( ! responseBuffer ) {
          winston.doWarn('followLinkUtils: getGoogleDocTitleSummaryAndData: no responseBuffer', {linkInfoId: linkInfo._id});
          callback( null, null, mimeType );

        } else {
          var docData = responseBuffer.toString();
          if ( mimeType == 'text/html' ) {
            linkInfo.summary = followLinkUtils.extractSummaryFromHTML( docData );
          } else if ( mimeType == 'text/plain' ) {
            linkInfo.summary = docData.substring(0, constants.LINK_SUMMARY_CUTOFF);
          }
          callback( null, responseBuffer, mimeType );
        }
      });
    }
  });
}

exports.followLinkDirectly = function(linkInfo, callback) {

  if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }
  
  var url = followLinkUtils.getRealURL( linkInfo );
  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  winston.doInfo('followLinkUtils: followLinkDirectly...', {linkInfoId: linkInfo._id});

  webUtils.webGet( url, true, function( err, responseBuffer, resolvedURL, responseHeaders ) {

    var warnData = {err: err, url: url};

    if ( err ) {
      winston.doWarn( 'followLinkUtils: followLinkDirectly: error from webGet', warnData );
      callback();
      
    } else if ( ! responseBuffer ) {
      winston.doWarn( 'followLinkUtils: followLinkDirectly: no responseBuffer from webGet', warnData );
      callback();

    } else {
      linkInfo.resolvedURL = resolvedURL;
      var contentType = null;
      if ( responseHeaders && responseHeaders['content-type'] ) {
        contentType = responseHeaders['content-type'];
      }

      if ( contentType && ( contentType.indexOf ('text/html') != -1 ) ) {
        var html = responseBuffer.toString();
        var title = followLinkUtils.extractTitleFromHTML( html );
        var summary = followLinkUtils.extractSummaryFromHTML( html );

        linkInfo.title = title;
        linkInfo.summary = summary;

        var mimeType = 'text/html';
        linkInfo.followType = 'direct';
        callback( null, html, mimeType );

      } else if ( contentType && ( contentType.indexOf ('application/pdf') != -1 ) ) {
        var pdfData = responseBuffer;
        var mimeType = 'application/pdf';
        linkInfo.followType = 'pdf';
        callback( null, pdfData, mimeType );

      } else if ( contentType && ( contentType.indexOf ('text/plain') != -1 ) ) {
        winston.doWarn('followLinkUtils: followLinkDirectly: text response, ignoring');
        callback();

      } else {
        winston.doWarn('followLinkUtils: followLinkDirectly: response neither html nor pdf', 
          {contentType: responseHeaders['content-type'], url : url});
        callback ();
      }
    }
  });
}

exports.addImageToLinkInfo = function( message, linkInfo, imageURL, callback ) {

  if ( ! imageURL ) { callback(); return; } //This case is actually expected...it makes things cleaner for the caller.
  if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }

  //winston.doInfo('followLinkUtils: addImageToLinkInfo...', {linkInfoId: linkInfo._id});

  //Pass null as 2nd argument to respect default value for "useAzure"
  winston.doInfo('followLinkUtils: about to downloadAndSaveImage', {imageURL: imageURL});
  cloudStorageUtils.downloadAndSaveImage( imageURL, null, function ( err ) {
    if ( err ) {
      callback( err );

    } else {
      var imagePath = cloudStorageUtils.getImageCloudPathFromURL( imageURL );
      linkInfo.image = imagePath;

      // make job to generate thumbnail
      var thumbnailJob = {
        comparableURLHash : linkInfo.comparableURLHash,
        cloudPath : imagePath,
        isRollover : true,
        resourceId : linkInfo._id,
        jobType : 'thumbnail',
        modelName : 'LinkInfo'
      }

      imageUtils.pushThumbnailJobToQueue(message.isQuick, thumbnailJob, callback);
    }
  });
}

exports.updateAndIndexLinks = function(message, linkInfo, callback ) {
  
  if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }

  //This should only be called with linkInfos that have a non-fail followType
  if ( ( ! linkInfo.followType ) || ( linkInfo.followType == 'fail' ) ) {
    winston.doError('missing or failed followType', {linkInfoId: linkInfo._id});
    callback();
    return;
  }

  //winston.doInfo('followLinkUtils: updateAndIndexLinks...', {linkInfoId: linkInfo._id});

  var filter = {
    comparableURLHash: linkInfo.comparableURLHash
  };

  var updateSet = {$set: {
      linkInfoId: linkInfo._id
    , isFollowed: true
  }};

  if ( linkInfo.image ) {
    updateSet['$set']['image'] = linkInfo.image;
  }
  if ( linkInfo.imageThumbExists ) {
    updateSet['$set']['imageThumbExists'] = linkInfo.imageThumbExists;
  }
  if ( linkInfo.title ) {
    updateSet['$set']['title'] = linkInfo.title;
  }
  if ( linkInfo.summary ) {
    updateSet['$set']['summary'] = linkInfo.summary;
  }
  if ( linkInfo.resolvedURL ) {
    updateSet['$set']['resolvedURL'] = linkInfo.resolvedURL;
  }

  LinkModel.update( filter, updateSet, {multi: true}, function( err ) {
    if ( err ) {
      callback( winston.makeMongoError( err ) );

    } else {
      LinkModel.find( filter, function( err, foundLinks ) {
        if ( err ) {
          callback( winston.makeMongoError( err ) );

        } else if ( ( ! foundLinks ) || ( ! ( foundLinks.length > 0 ) ) ) {
          callback( winston.makeError('no foundLink(s) after update', {filter: filter, linkInfoId: linkInfo._id}) );

        } else {
          async.each( foundLinks, function( foundLink, eachCallback ) {

            if ( ! foundLink.isPromoted ) {
              eachCallback();

            } else {
              //TODO: get message
              indexingHandler.createIndexingJobForDocument(message.isQuick, foundLink, true, false, eachCallback );
            }

          }, callback );
        }
      });
    }
  });
}

exports.updateLinkInfoAfterFollowingLink = function( linkInfo, callback ) {

  if ( ! linkInfo ) { callback( winston.makeMissingParamError('linkInfo') ); return; }
  if ( ! linkInfo._id ) { callback( winston.makeMissingParamError('linkInfo._id') ); return; }
  if ( ! linkInfo.followType ) { callback( winston.makeMissingParamError('linkInfo.followType') ); return; }

  //winston.doInfo('followLinkUtils: updateLinkInfoAfterFollowingLink...', {linkInfoId: linkInfo._id});

  var updateSet = {$set: {
      lastFollowDate: linkInfo.lastFollowDate
    , followType: linkInfo.followType
  }};
  if ( linkInfo.resolvedURL ) {
    updateSet['$set']['resolvedURL'] = linkInfo.resolvedURL;
  }
  if ( linkInfo.image ) {
    updateSet['$set']['image'] = linkInfo.image;
  }
  if ( linkInfo.origImageUrl ) {
    updateSet['$set']['origImageUrl'] = linkInfo.origImageUrl;
  }
  if ( linkInfo.title ) {
    updateSet['$set']['title'] = linkInfo.title;
  }
  if ( linkInfo.summary ) {
    updateSet['$set']['summary'] = linkInfo.summary;
  }

  LinkInfoModel.update({_id: linkInfo._id}, updateSet, function(err) {
    if ( err ) {
      callback( winston.makeMongoError( err ) );
    } else {
      callback();
    }
  });
}

exports.extractFieldFromHTML = function( html, field ) {
  if ( ! html ) {
    return '';
  }

  var regex = new RegExp("<" + field + "[\\s\\S]*?>([\\s\\S]*?)<\/" + field + ">");
  var match = html.match(regex);

  if (match && match.length > 1) {
    return followLinkUtils.stripHtml(match[1]);
  }
  else {
    return '';
  }

}

exports.stripHtml = function (str) {
  if (str) {
    var regex = /(<([^>]+)>)/ig;
    var scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/ig;
    return str.replace(scriptRegex, " ").replace(regex, " ").replace(/\s{2,}/g," ").replace(/\&nbsp;/g, "").replace (/ [\.\?\!]/g, ".").trim();
  } else{
    return str
  }
}

exports.extractTitleFromHTML = function( html ) {
  return followLinkUtils.extractFieldFromHTML( html, 'title' );
}

exports.extractSummaryFromHTML = function( html ) {
  if ( ! html ) {
    return '';
  }

  var summary = followLinkUtils.extractDescriptionFromHTML( html );
  if ( ! summary ) {
    summary = followLinkUtils.extractFieldFromHTML( html, 'body' );
  }

  if ( summary ) {
    summary = summary.substring(0, constants.LINK_SUMMARY_CUTOFF);
    summary = summary.trim();
  }

  return summary;
}

exports.extractDescriptionFromHTML = function( html ) {
  if ( ! html ) {
    return '';
  }

  var match = html.match(/<meta name="description" content="([\s\S]*?)"/);

  if (match && match.length > 1) {
    return match[1].trim()
  }
  else {
    return '';
  }
}

exports.getRealURL = function(linkInfo) {
  var realURL = '';
  if ( ! linkInfo ) {
    winston.doWarn('followLinkUtils: getRealURL: no linkInfo!');
    return realURL;
  }

  if ( linkInfo.resolvedURL ) {
    realURL = linkInfo.resolvedURL;
  } else {
    realURL = linkInfo.rawURL;
  }

  realURL = urlUtils.cleanURL( realURL );
  return realURL;
}
