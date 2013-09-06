var serverCommon = process.env.SERVER_COMMON;

var winston = require(serverCommon + '/lib/winstonWrapper').winston
  , constants = require(serverCommon + '/constants')
  , utils = require(serverCommon + '/lib/utils')
  , upgradeUtils = require(serverCommon + '/lib/upgradeUtils')
  , UserActionModel = require(serverCommon + '/schema/userAction').UserActionModel
  , UserModel = require(serverCommon + '/schema/user').UserModel

var userUtils = this;

//callback has arguments: err, hitNewThreshold (boolean), numUserActions (in the category of 'action'), numNewDays
exports.addUserAction = function( user, action, resourceId, resourceType, callback ) {

  if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
  if ( ! action ) { callback( winston.makeMissingParamError('action') ); return; }
  if ( ! resourceId ) { callback( winston.makeMissingParamError('resourceId') ); return; }
  if ( ! resourceType ) { callback( winston.makeMissingParamError('resourceType') ); return; }

  var userAction = new UserActionModel({
      userId: user._id
    , action: action
    , resourceId: resourceId
    , resourceType: resourceType
  });

  userAction.save( function(mongoErr, savedUserAction, numAffected) {
    if ( mongoErr && ( mongoErr.code === 11000 ) ) {
      //duplicate key, no change.
      callback();

    } else if ( mongoErr ) {
      callback( winston.makeMongoError( mongoErr ) );

    } else if ( numAffected ) {
      userUtils.checkNewUserAction( user, action, function(err, hitNewThreshold, numUserActions, numNewDays) {
        if ( err ) {
          callback( err );

        } else {
          callback( null, hitNewThreshold, numUserActions, numNewDays );
        }
      });

    } else {
      callback();
    }
  });
}

//callback has arguments: err, hitNewThreshold (boolean), numUserActions (in the category of 'action'), numNewDays
exports.checkNewUserAction = function( user, action, callback ) {

  if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
  if ( ! action ) { callback( winston.makeMissingParamError('action') ); return; }

  userUtils.getUserActionCounts( user, function(err, numFavoriteActions, numLikeActions) {
    if ( err ) {
      callback( err );

    } else {
      var hitNewThreshold = false;
      if ( ( action == 'favorite' ) && numFavoriteActions && constants.USER_ACTION_FAVORITE_THRESHOLDS[numFavoriteActions] ) {
        hitNewThreshold = true;
      } else if ( ( action == 'like' ) && numLikeActions && constants.USER_ACTION_LIKE_THRESHOLDS[numLikeActions] ) {
        hitNewThreshold = true;
      }

      if ( hitNewThreshold ) {
        var forceResumeDownloadJob = false;
        upgradeUtils.updateUserAccountStatus( user, forceResumeDownloadJob, function(err, userChanged, numNewDays) {
          if ( err ) {
            callback( err );

          } else if ( ( ! userChanged ) && ( ! numNewDays ) ) {
            callback();

          } else {
            var numUserActions = 0;
            if ( action == 'favorite' ) {
              numUserActions = numFavoriteActions;
            } else if ( action == 'like' ) {
              numUserActions = numLikeActions;
            }
            callback( null, hitNewThreshold, numUserActions, numNewDays );
          }
        });

      } else {
        callback();
      }
    }
  });
}

//callback has arguments: err, numFavoriteActions, numLikeActions
exports.getUserActionCounts = function( user, callback ) {

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
          callback( null, numFavoriteActions, numLikeActions );
        }
      });
    }
  });
}

exports.getUserActionEarnedDays = function( user, callback ) {

  if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }

  userUtils.getUserActionCounts( user, function(err, numFavoriteActions, numLikeActions) {
    if ( err ) {
      callback( err );

    } else {
      var numEarnedDays = 0;
      numEarnedDays += userUtils.calculateUserActionEarnedDays( numFavoriteActions, constants.USER_ACTION_FAVORITE_THRESHOLDS );
      numEarnedDays += userUtils.calculateUserActionEarnedDays( numLikeActions, constants.USER_ACTION_LIKE_THRESHOLDS );
      callback( null, numEarnedDays );
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