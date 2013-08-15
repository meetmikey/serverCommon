var winston = require('./winstonWrapper').winston
  , fs = require('fs')
  , utils = require('./utils')
  , urlUtils = require('./urlUtils')
  , contactUtils = require('./contactUtils')
  , indexingHandler = require('./indexingHandler')
  , followLinkUtils = require('./followLinkUtils')
  , conf = require('../conf')
  , constants = require('../constants')
  , LinkModel = require('../schema/link').LinkModel
  , LinkInfoModel = require('../schema/linkInfo').LinkInfoModel

var linkUtils = this;

linkUtils.validTopLevelDomains = null;

exports.checkAndMarkLinkPromoted = function( link, contactData, isSentByUser, isLinkAlreadyInDB, callback ) {

  if ( ! link ) { callback( winston.makeMissingParamError('link') ); return; }
  if ( ! link.url ) { callback( winston.makeMissingParamError('link.url') ); return; }
  if ( ! link.userId ) { callback( winston.makeMissingParamError('link.userId') ); return; }
  if ( ! contactData ) { callback( winston.makeMissingParamError('contactData') ); return; }

  var url = link.url;

  if ( link.isPromoted ) {
    link.isPromoted = false;
  }

  if ( ( ! isSentByUser )
    && ( ( contactData.sent + contactData.corecipient ) < constants.MIN_SENT_AND_CORECEIVE ) ) {
    winston.doInfo('linkUtils: checkAndMarkLinkPromoted: url is not promotable because contact sent and corecipient are both zero');
    link.nonPromotableReason = 'sender';
    callback();

  } else if ( contactUtils.isBadContactRatio( contactData ) ) {
    winston.doInfo('linkHandler: isPromotableWithData: url is not promotable because contact ratio is too high', {contactData: contactData, link: link});
    link.nonPromotableReason = 'senderRatio';
    callback();

  } else if ( utils.containsSubstringFromArray( url, constants.URL_FILTER_TEXT ) ) {
    winston.doWarn('linkUtils: checkAndMarkLinkPromoted: url is not promotable because of filter text', {url: url});
    link.nonPromotableReason = 'text';
    callback();

  } else if ( utils.regexMatch (url, constants.URL_FILTER_REGEX)) {
    winston.doWarn('linkUtils: checkAndMarkLinkPromoted: url is not promotable because of regex', {url: url});
    link.nonPromotableReason = 'regex';
    callback();

  } else {
    linkUtils.getNumDuplicateLinksForUser( url, link.userId, function( err, numDuplicateLinks ) {
      if ( err ) {
        callback( err );

      } else {
        if ( isLinkAlreadyInDB ) {
          numDuplicateLinks = numDuplicateLinks - 1;
        }

        if ( numDuplicateLinks && ( numDuplicateLinks >= constants.MAX_DUPLICATE_LINKS_FOR_USER ) ) {
          link.nonPromotableReason = 'duplicates';
        } else {
          link.isPromoted = true;
          if ( link.nonPromotableReason ) {
            delete link.nonPromotableReason;
          }
        }
        callback();
      }
    });
  }
}

exports.getNumDuplicateLinksForUser = function( url, userId, callback ) {

  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }
  if ( ! userId ) { callback( winston.makeMissingParamError('userId') ); return; }

  //winston.doInfo('linkUtils: getNumDuplicateLinksForUser...', {url: url});

  var comparableURLHash = urlUtils.getComparableURLHash( url );
  LinkModel.count({userId: userId, comparableURLHash: comparableURLHash, isPromoted: true}, function(err, numDuplicateLinks) {
    if ( err ) {
      callback( winston.makeMongoError(err) );

    } else {
      callback( null, numDuplicateLinks );
    }
  });
}

exports.isValidURL = function( url ) {

  if ( ( ! url ) || ( url.length == 0 ) ) {
    winston.doMissingParamError('url');
    return false;
  }

  if ( url.indexOf('@') !== -1 ) { //Make sure it's not an email address...
    return false;
  }
  if ( urlUtils.isImageURL(url) ) {
    return false;
  }
  if ( ! linkUtils.isValidTopLevelDomain( url ) ) {
    return false;
  }
  return true;
}

exports.isValidTopLevelDomain = function( url ) {

  if ( ! url ) {
    return false;
  }
  
  url = urlUtils.addProtocolIfMissing( url );

  var parsedURL = urlUtils.parseURL(url);
  var hostname = parsedURL.hostname;
  var lastDotIndex = hostname.lastIndexOf('.');

  if ( lastDotIndex == -1 ) {
    return false;
  }

  var topLevelDomain = hostname.substring(lastDotIndex + 1);
  if ( ! topLevelDomain ) {
    return false;
  }

  var topLevelDomainUpper = topLevelDomain.toUpperCase();
  var topLevelDomains = linkUtils.getValidTopLevelDomains();

  if ( ( ! topLevelDomains ) || ( ! ( topLevelDomains.length > 0 ) ) ) {
    winston.doError('no top level domains!!!');
    return false;
  } else {
    if ( topLevelDomains.indexOf(topLevelDomainUpper) !== -1 ) {
      return true;
    }
    return false;
  }
}

exports.getValidTopLevelDomains = function() {

  if ( linkUtils.validTopLevelDomains === null ) {
    var data = fs.readFileSync( conf.validTopLevelDomainsFile, 'utf8' );
    if ( ! data ) {
      linkUtils.validTopLevelDomains = [];
      winston.doError('no data from top level domains file!');
    } else {
      linkUtils.validTopLevelDomains = data.split('\n');
    }
  }
  return linkUtils.validTopLevelDomains;
}

//Should only be called on promoted links that should be followed
exports.getLinkInfoAndUpdateLink = function(message, link, callback ) {

  if ( ! link ) { callback( winston.makeMissingParamError('link') ); return; }

  linkUtils.getLinkInfo( message, link, function( err, linkInfo ) {
    if ( err ) {
      callback( err );

    } else if ( ! linkInfo ) {
      callback( winston.makeError('no linkInfo', {url: link.url}) );

    } else {
      linkUtils.updateLinkFromLinkInfo( link, linkInfo, function( err, updatedLink ) {
        if ( err ) {
          callback( err );

        } else if ( ! updatedLink ) {
          callback( winston.makeError('no updated link!', {linkId: link._id, mailId: link.mailId}) );

        } else {

          if ( updatedLink.isPromoted && updatedLink.isFollowed ) {
            indexingHandler.createIndexingJobForDocument(message.isQuick, updatedLink, true, false, callback );

          } else {
            callback();
          }
        }
      });
    }
  });
}

//Should only be called on promoted links that should be followed
exports.getLinkInfo = function(message, link, callback ) {

  if ( ! link ) { callback( winston.makeMissingParamError('link') ); return; }

  var url = link.url;
  var comparableURL = urlUtils.getComparableURL(url);
  var comparableURLHash = urlUtils.hashURL(comparableURL);

  //winston.doInfo('linkUtils: getLinkInfo...', {url: url});

  var filter = {
    comparableURLHash: comparableURLHash
  }
  var updateSet = { $set: {
      comparableURLHash: comparableURLHash
    , rawURL: url
    , comparableURL: comparableURL
  }};
  var options = {
      upsert:true
    , new: false
  }

  LinkInfoModel.findOneAndUpdate( filter, updateSet, options, function( err, previousLinkInfo ) {
    if ( err ) {
      callback( winston.makeMongoError( err ) );

    } else {
      //Lookup the thing we just saved.
      //This seems wasteful, but I'd really like to have the clean linkInfo we're using 'new': false
      LinkInfoModel.findOne({comparableURLHash: comparableURLHash}, function(err, linkInfo) {
        if ( err ) {
          callback(err);

        } else if ( ! linkInfo ) {
          callback( winston.makeError('failed to find linkInfo we just upserted', {comparableURLHash: comparableURLHash, rawURL: url}) );

        } else {
          //we either just created this linkInfo, or we hadn't previously created the link follow job or
          //it's a google doc in which case the follow job could have failed due to bad tokens so we should
          //retry it anyway
          if ( ( ! previousLinkInfo._id ) || ( ! linkInfo.followJobCreated ) || linkUtils.isGoogleDocFail (linkInfo) ) {

            followLinkUtils.createFollowLinkJob( message.isQuick, linkInfo, link.userId, function(err) {
              if ( err ) {
                callback(err);
                
              } else {
                linkInfo.followJobCreated = true;
                linkInfo.save( function(mongoErr) {
                  if ( mongoErr ) {
                    callback( winston.makeMongoError(mongoErr) );

                  } else {
                    callback( null, linkInfo );
                  }
                });
              }
            });
          } else {
            callback( null, linkInfo );
          }
        }
      });
    }
  });
}

exports.isGoogleDocFail = function (linkInfo) {
  return linkInfo.followType == 'fail' && urlUtils.isGoogleDoc (linkInfo.rawURL);
}

exports.updateLinkFromLinkInfo = function( link, linkInfo, callback ) {

  if ( ! link ) { winston.doMissingParamError('link'); return; }
  if ( ! linkInfo ) { winston.doMissingParamError('linkInfo'); return; }

  var updateSet = {$set: {
      linkInfoId: linkInfo._id
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
  if ( linkInfo.followType && linkInfo.followType !== 'fail' ) {
    updateSet['$set']['isFollowed'] = true;
  }

  LinkModel.findOneAndUpdate( {_id: link._id}, updateSet, function( err, updatedLink ) {
    if ( err ) {
      callback( winston.makeMongoError( err ) );

    } else if ( ! updatedLink ) {
      callback( winston.makeError('no updatedLink') );

    } else {
      callback(null, updatedLink);
    }
  });
}
