var serverCommon = process.env.SERVER_COMMON;

var UserActionModel = require(serverCommon + '/schema/userAction').UserActionModel
  , winston = require(serverCommon + '/lib/winstonWrapper').winston
  , constants = require(serverCommon + '/constants')
  , utils = require(serverCommon + '/lib/utils')

var userUtils = this;

exports.addUserAction = function( user, action, resourceId, resourceType ) {

  if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
  if ( ! action ) { callback( winston.makeMissingParamError('action') ); return; }
  if ( ! resourceId ) { callback( winston.makeMissingParamError('resourceId') ); return; }
  if ( ! resourceType ) { callback( winston.makeMissingParamError('resourceType') ); return; }

  //TODO: write this...
  //inserts the userAction
  //if it succeeded (non-dupe), checkUserActions
}

exports.checkUserActions = function( user, callback ) {

  if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }

  //TODO: write this...
  var hitNewThreshold = false;

  //count up the user actions for this user
  //check if we hit a threshold
  //if so, update user days count
  var forceResumeDownloadJob = false;
  upgradeUtils.updateUserAccountStatus( user, forceResumeDownloadJob, function(err) {
    if ( err ) {
      callback( err );

    } else {
      callback( null, hitNewThreshold, numUserActions );
    }
  });
}

exports.getUserActionEarnedDays = function( user, callback ) {

  if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }

  var favoriteFilter = {
      userId: user._id
    , action: 'favorite'
  };
  var likeFilter = {
      userId: user._id
    , action: 'like'
  };

  UserActionModel.count( favoriteFilter, function(mongoErr, numFavoriteActions) {
    if ( mongoErr ) {
      callback( winston.makeMongoError( mongoErr ) );

    } else {
      UserActionModel.count( likeFilter, function(mongoErr, numLikeActions) {
        if ( mongoErr ) {
          callback( winston.makeMongoError( mongoErr ) );

        } else {
          favoriteThresholds = constants.USER_ACTION_FAVORITE_THRESHOLDS;
          likeThresholds = constants.USER_ACTION_LIKE_THRESHOLDS;
          var numEarnedDays = 0;
          numEarnedDays += userUtils.calculateUserActionEarnedDays( numFavoriteActions, favoriteThresholds );
          numEarnedDays += userUtils.calculateUserActionEarnedDays( numLikeActions, likeThresholds );
          callback( null, numEarnedDays );
        }
      });
    }
  });
}

exports.calculateUserActionEarnedDays = function( numActions, thresholds ) {

  if ( ( ! numActions ) || ( ! utils.isObject( thresholds ) ) ) {
    return 0;
  }

  var numEarnedDays = 0;
  for ( var threshold in thresholds ) {
    if ( numActions >= threshold ) {
      numEarnedDays += thresholds[threshold];
    }
  }

  return numEarnedDays;
}