var serverCommon = process.env.SERVER_COMMON;

var UserModel = require(serverCommon + '/schema/user').UserModel
	, UserUpgradeEventModel = require(serverCommon + '/schema/userUpgradeEvent').UserUpgradeEventModel
	, ExtraDaysModel = require('../schema/extraDays').ExtraDaysModel
	, ReferralModel = require('../schema/referral').ReferralModel
  , winston = require(serverCommon + '/lib/winstonWrapper').winston
  , conf = require(serverCommon + '/conf')
  , constants = require ('../constants')
  , utils = require(serverCommon + '/lib/utils')
  , sesUtils = require(serverCommon + '/lib/sesUtils')
  , sqsConnect = require(serverCommon + '/lib/sqsConnect')
  , mailDownloadUtils = require(serverCommon + '/lib/mailDownloadUtils')
	, stripe = require('stripe')(conf.stripe.secretKey)


var upgradeUtils = this;

exports.tryOrCreateUpgradeJob = function( userEmail, stripeCardToken, billingPlan, callback ) {

	//TODO: do we always need a stripeCardToken?  Could change plans but use a previous token.

	if ( ! userEmail ) { callback( winston.makeMissingParamError('userEmail') ); return; }
	if ( ! stripeCardToken ) { callback( winston.makeMissingParamError('stripeCardToken') ); return; }
	if ( ! billingPlan ) { callback( winston.makeMissingParamError('billingPlan') ); return; }

	UserModel.findOne( {email: userEmail}, function(mongoErr, user) {
		if ( mongoErr ) {
			callback( winston.makeMongoError(mongoErr) );

		} else if ( ! user ) {
			callback( winston.makeError('no user', {email: userEmail}) );

		} else {
			var userUpgradeEvent = new UserUpgradeEventModel({
					userId: user._id
				, stripeCardToken: stripeCardToken
				, billingPlan: billingPlan
				, stripeCustomerId: user.stripeCustomerId
			});

			upgradeUtils.saveUserUpgradeEventTryAndCreateJob( userUpgradeEvent, callback );
		}
	});
}

exports.tryOrCreateCancelUserBillingPlanJob = function( userEmail, callback ) {

	if ( ! userEmail ) { callback( winston.makeMissingParamError('userEmail') ); return; }

	UserModel.findOne( {email: userEmail}, function(mongoErr, user) {
		if ( mongoErr ) {
			callback( winston.makeMongoError(mongoErr) );

		} else if ( ! user ) {
			callback( winston.makeError('no user', {email: userEmail}) );

		} else {
			var userUpgradeEvent = new UserUpgradeEventModel({
					userId: user._id
				, billingPlan: 'free'
				, stripeCustomerId: user.stripeCustomerId
			});

			upgradeUtils.saveUserUpgradeEventTryAndCreateJob( userUpgradeEvent, callback );
		}
	});
}

exports.saveUserUpgradeEventTryAndCreateJob = function( userUpgradeEvent, callback ) {

	if ( ! userUpgradeEvent ) { callback( winston.makeMissingParamError('userUpgradeEvent') ); return; }

	userUpgradeEvent.save( function(mongoErr) {
		if ( mongoErr ) {
			callback( winston.makeMongoError( mongoErr ) );
			upgradeUtils.markUserUpgradeEventStatusFail( userUpgradeEvent, 'userUpgradeEventSave' );

		} else {
			var userUpgradeJob = {
		    	jobType : 'userUpgrade'
		    , userUpgradeEventId: userUpgradeEvent._id
		  };

		  upgradeUtils.doUserUpgradeJob( userUpgradeJob, function(err) {
		  	if ( err ) {
		  		winston.doWarn('userUpgradeJob first attempt failed', {userUpgradeJob: userUpgradeJob});
					sqsConnect.addMessageToWorkerQueue( userUpgradeJob, function(err) {
						if ( err ) {
							
							callback(); //Here we should callback without error.
							//The user should see that the transaction succeeded, since it eventually will.
							//(or a manual customer service intervention should occur)

							winston.handleError( err );
							upgradeUtils.markUserUpgradeEventStatusFail( userUpgradeEvent, 'jobCreation' );

							//VERY BAD.  Send email
							var text = 'userId: ' + userUpgradeEvent.userId + ', userUpgradeEventId: ' + userUpgradeEvent._id;
							var subject = 'VERY BAD: charge failed, no worker job created';
							sesUtils.sendInternalNotificationEmail( text, subject, function(err) {
								if ( err ) {
									winston.handleError(err);
									winston.doError('saveUserUpgradeEventTryAndCreateJob: REALLY BAD!', {userUpgradeEvent: userUpgradeEvent});
								}
							});

						} else {
							//TODO: do we need a special return status for this so the front-end knows it might take a minute to work?
							callback();
						}
					});

		  	} else {
		  		callback();
		  	}
		  });
		}
	});
}

exports.doUserUpgradeJob = function( userUpgradeJob, callback ) {

	if ( ! userUpgradeJob ) { callback( winston.makeMissingParamError('userUpgradeJob') ); return; }
	if ( ! userUpgradeJob.userUpgradeEventId ) { callback( winston.makeMissingParamError('userUpgradeJob.userUpgradeEventId') ); return; }

	UserUpgradeEventModel.findById( userUpgradeJob.userUpgradeEventId, function(mongoErr, userUpgradeEvent) {
		if ( mongoErr ) {
			callback( winston.makeMongoError(mongoErr) );

		} else if ( ! userUpgradeEvent ) {
			callback( winston.makeError('no userUpgradeEvent') );

		} else {
			var userId = userUpgradeEvent.userId;
			UserModel.findById( userId, function(mongoErr, user) {
				if ( mongoErr ) {
					callback( winston.makeMongoError(mongoErr) );
					upgradeUtils.markUserUpgradeEventStatusFail( userUpgradeEvent, 'userLookup' );

				} else if ( ! user ) {
					callback( winston.makeError('no user', {userId: userId}) );
					upgradeUtils.markUserUpgradeEventStatusFail( userUpgradeEvent, 'noUser' );

				} else {
					if ( userUpgradeEvent.billingPlan == 'free' ) {
						upgradeUtils.cancelUserBillingPlan( user, userUpgradeEvent, callback );

					} else {
						upgradeUtils.subscribeUserBillingPlan( user, userUpgradeEvent, callback );
					}
				}
			});
		}
	});
}

exports.subscribeUserBillingPlan = function( user, userUpgradeEvent, callback ) {

	if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
	if ( ! userUpgradeEvent ) { callback( winston.makeMissingParamError('userUpgradeEvent') ); return; }
	var stripeCardToken = userUpgradeEvent.stripeCardToken;
	if ( ! stripeCardToken ) { callback( winston.makeMissingParamError('stripeCardToken') ); return; }
	var billingPlan = userUpgradeEvent.billingPlan;
	if ( ! billingPlan ) { callback( winston.makeMissingParamError('billingPlan') ); return; }

	upgradeUtils.setStripeCustomerData( user, stripeCardToken, function(err) {
		if ( err ) {
			callback( err );
			upgradeUtils.markUserUpgradeEventStatusFail( userUpgradeEvent, 'setStripeCustomerData' );

		} else {
			user.billingPlan = billingPlan;
			user.billingPlanStartDate = Date.now();

			var updateData = {$set: {
	    		billingPlan: user.billingPlan
	    	, billingPlanStartDate: user.billingPlanStartDate
	    	, stripeCustomerId: user.stripeCustomerId //user.stripeCustomerId should have been set by setStripeCustomerData()
	    	, stripeCardToken: user.stripeCardToken //user.stripeCardToken should have been set by setStripeCustomerData()
	    }};

	    UserModel.findByIdAndUpdate( user._id, updateData, function(mongoErr) {
	    	if ( mongoErr ) {
	    		callback( winston.makeMongoError( mongoErr ) );
	    		upgradeUtils.markUserUpgradeEventStatusFail( userUpgradeEvent, 'userUpdate' );

	    	} else {
					upgradeUtils.setStripeSubscription( user, function(err) {
						if ( err ) {
							callback( err );
							upgradeUtils.markUserUpgradeEventStatusFail( userUpgradeEvent, 'setStripeSubscription' );

						} else {
					    upgradeUtils.markUserUpgradeEventStatus( userUpgradeEvent, 'success', null, function(err) {
					    	if ( err ) {
					    		callback( err );

					    	} else {
									upgradeUtils.updateUserAccountStatus( user, false, callback );
								}
					    });
			    	}
			    });
				}
			});
		}
	});
}

exports.setStripeSubscription = function( user, callback ) {

	if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
	if ( ! user.stripeCustomerId ) { callback( winston.makeMissingParamError('user.stripeCustomerId') ); return; }
	if ( ! user.stripeCardToken ) { callback( winston.makeMissingParamError('user.stripeCardToken') ); return; }
	if ( ! user.billingPlan ) { callback( winston.makeMissingParamError('user.billingPlan') ); return; }

	var stripeChargeData = {
		plan: user.billingPlan
	};

	stripe.customers.update_subscription( user.stripeCustomerId, stripeChargeData, function( stripeErr, customer ) {
		if ( stripeErr ) {
			callback( winston.makeError('stripeChargeError', {stripeError: stripeErr.message, userId: user._id}) );

		} else {
			callback();
		}
	});
}

//Sets the stripeCardToken on the customer in stripe, making a new customer if necessary.
//NOTE: does NOT set the user data in our database, only stripe.
exports.setStripeCustomerData = function( user, stripeCardToken, callback ) {

	if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
	if ( ! stripeCardToken ) { callback( winston.makeMissingParamError('stripeCardToken') ); return; }

	if ( user.stripeCustomerId ) {
		var stripeUpdateData = {
			card: stripeCardToken
		};

		stripe.customers.update( user.stripeCustomerId, stripeUpdateData, function( stripeErr ) {
			if ( stripeErr ) {
	      callback( winston.makeError('stripeError', {stripeError: stripeErr.message, userId: user._id}) );

     	} else {
     		callback();
     	}
		});

	} else {
		var stripeCustomerData = {
				email: user.email
			, card: stripeCardToken
			, description: utils.getFullName( user.firstName, user.lastName )
		};

		stripe.customers.create( stripeCustomerData, function( stripeErr, customer ) {
	    if ( stripeErr ) {
	       callback( winston.makeError('stripeError', {stripeError: stripeErr.message, userId: user._id}) );

	    } else {
	    	var stripeCustomerId = customer.id;
		    user.stripeCustomerId = stripeCustomerId;
		    user.stripeCardToken = stripeCardToken;
		    callback();
		  }
		});
	}
}

exports.markUserUpgradeEventStatus = function( userUpgradeEvent, status, failReason, callback ) {

	if ( ! userUpgradeEvent ) { callback( winston.makeMissingParamError('userUpgradeEvent') ); return; }
	if ( ! userUpgradeEvent._id ) { callback( winston.makeMissingParamError('userUpgradeEvent._id') ); return; }
	if ( ! status ) { callback( winston.makeMissingParamError('status') ); return; }

	userUpgradeEvent.status = status;
	var userUpgradeEventUpdateData = {$set: {
		status: userUpgradeEvent.status
	}};

	if ( failReason ) {
		userUpgradeEventUpdateData['$set']['failReason'] = failReason;
	}

	UserUpgradeEventModel.findByIdAndUpdate( userUpgradeEvent._id, userUpgradeEventUpdateData, function(mongoErr) {
		if ( mongoErr ) {
			callback( winston.makeMongoError( mongoErr ) );

		} else {
			callback();
		}
	});
}

//Just marks fail and handles any error.  Useful for best-effort fail saving.
exports.markUserUpgradeEventStatusFail = function( userUpgradeEvent, failReason ) {
	upgradeUtils.markUserUpgradeEventStatus( userUpgradeEvent, 'fail', failReason, function(err) {
		if ( err ) {
			winston.handleError( err );
		}
	});
}

exports.updateUserAccountStatusByUserId = function( userId, forceResumeDownloadJob, callback ) {

	if ( ! userId ) { callback( winston.makeMissingParamError('userId') ); return; }

	UserModel.findById( userId, function(mongoErr, user) {
		if ( mongoErr ) {
			callback( winston.makeMongoError( mongoErr ) );

		} else if ( ! user ) {
			callback( winston.makeError('no user', {userId: userId}) );

		} else {
			upgradeUtils.updateUserAccountStatus( user, forceResumeDownloadJob, callback );
		}
	});
}

//This function makes sure the user has the appropriate benefits (e.g. extra days or premium)
exports.updateUserAccountStatus = function( user, forceResumeDownloadJob, callback ) {

	if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }

	upgradeUtils.updateUserIsPremium( user, function(err, isPremiumChanged) {
		if ( err ) {
			callback( err );

		} else {
			upgradeUtils.updateUserDaysLimit( user, function(err, daysLimitChanged) {
				if ( err ) {
					callback( err );

				} else if ( forceResumeDownloadJob || isPremiumChanged || ( ( ! user.isPremium ) && daysLimitChanged ) ) {
          var startingPoint;
          mailDownloadUtils.createResumeDownloadNow( user, startingPoint, false, callback );

				} else {
					callback();
				}
			});
		}
	});
}

//Decides if the user should be premium and updates the user.
//The 2nd argument in the callback will be a flag for whether or not the isPremium flag actually changed.
exports.updateUserIsPremium = function( user, callback ) {

	if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }

	var userId = user._id;
	var userIsPremiumBefore = user.isPremium;
	user.isPremium = upgradeUtils.shouldUserBePremium( user );

	var isPremiumChanged = false;
	if ( userIsPremiumBefore !== user.isPremium ) {
		isPremiumChanged = true;
	}

	if ( isPremiumChanged ) {
    var updateSet = {$set:{
      isPremium: user.isPremium
    }};

    UserModel.findByIdAndUpdate(userId, updateSet, function(mongoErr) {
      if ( mongoErr ) {
        callback( winston.makeMongoError( mongoErr ) );

      } else {
        callback( null, isPremiumChanged );
      }
    });

	} else {
		callback( null, isPremiumChanged );
	}
}

exports.shouldUserBePremium = function( user ) {
	if ( ! user ) {
		winston.doError('no user!');
		return false;
	}

	if ( user.isGrantedPremium
		|| ( user.billingPlan && ( user.billingPlan == constants.PLAN_PRO ) || ( user.billingPlan == constants.PLAN_TEAM ) ) ) {
		return true;
	}
	return false;
}

//Calculates and updates the user's daysLimit.
//The 2nd argument in the callback will be a flag for whether or not the daysLimit was actually updated.
exports.updateUserDaysLimit = function( user, callback ) {

  if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }

  var userId = user._id;
  var oldDaysLimit = user.daysLimit;

  ReferralModel.find({oldUserId: userId}, function(err, foundReferrals) {
    if ( err ) {
      callback( winston.makeMongoError(err) );

    } else {
      ExtraDaysModel.find({userId: userId}, function(err, foundExtraDays) {
        if ( err ) {
          callback( winston.makeMongoError(err) );

        } else {
          user.daysLimit = upgradeUtils.calculateDaysLimit( user, foundReferrals, foundExtraDays );
        	var daysLimitChanged = false;
        	if ( oldDaysLimit !== user.daysLimit ) {
        		daysLimitChanged = true;
        	}
        	
        	if ( daysLimitChanged ) {
	          var updateSet = {$set:{
	            daysLimit: user.daysLimit
	          }};

	          UserModel.findByIdAndUpdate(userId, updateSet, function(mongoErr) {
	            if ( mongoErr ) {
	              callback( winston.makeMongoError( mongoErr ) );

	            } else {
	              callback( null, daysLimitChanged );
	            }
	          });

        	} else {
        		callback( null, daysLimitChanged );
        	}
        }
      });
    }
  });
}

exports.calculateDaysLimit = function( user, foundReferrals, foundExtraDays ) {
  
  if ( ! user ) {
  	winston.doError('no user');
  	return 0;
  }

  var daysLimit = constants.BASE_DAYS_LIMIT

  if ( user.billingPlan && ( user.billingPlan == constants.PLAN_BASIC ) ) {
  	daysLimit = constants.BASE_DAYS_LIMIT_BASIC_PLAN;
  }

  if ( user.clickedChromeStoreReview ) {
  	daysLimit += constants.CHROMESTORE_REVIEW_EXTRA_DAYS;
  }

  if ( user.clickedFacebookLike ) {
  	daysLimit += constants.FACEBOOK_LIKE_EXTRA_DAYS;
  }
  
  if ( utils.isArray( foundReferrals ) && foundReferrals.length ) {
    var extraReferralDays = foundReferrals.length * constants.REFERRAL_EXTRA_DAYS;
    daysLimit += extraReferralDays;
  }

  if ( utils.isArray( foundExtraDays ) && foundExtraDays.length ) {
    for ( var i=0; i<foundExtraDays.length; i++ ) {
      var foundExtraDaysEntry = foundExtraDays[i];
      if ( foundExtraDaysEntry && foundExtraDaysEntry.numExtraDays ) {
        var extraDays = foundExtraDaysEntry.numExtraDays;
        daysLimit += extraDays;
      }
    }
  }
  return daysLimit;
}

exports.cancelUserBillingPlan = function( user, userUpgradeEvent, callback ) {

	if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
	if ( ! userUpgradeEvent ) { callback( winston.makeMissingParamError('userUpgradeEvent') ); return; }
	var stripeCustomerId = user.stripeCustomerId;
	if ( ! stripeCustomerId ) { callback( winston.makeMissingParamError('stripeCustomerId') ); return; }
	
	user.billingPlan = 'free';
	user.billingPlanEndDate = Date.now();

	var updateData = {$set: {
  		billingPlan: user.billingPlan
  	, billingPlanEndDate: user.billingPlanEndDate
  }};

  UserModel.findByIdAndUpdate( user._id, updateData, function(mongoErr) {
  	if ( mongoErr ) {
  		callback( winston.makeMongoError( mongoErr ) );
  		upgradeUtils.markUserUpgradeEventStatusFail( userUpgradeEvent, 'userUpdate' );

  	} else {
  		var atPeriodEnd = false;
			stripe.customers.cancel_subscription( stripeCustomerId, atPeriodEnd, function( stripeErr ) {
				if ( stripeErr ) {
					callback( winston.makeError('stripeCancelSubscriptionError', {stripeError: stripeErr.message, userId: user._id}) );
					upgradeUtils.markUserUpgradeEventStatusFail( userUpgradeEvent, 'cancelStripeSubscription' );

				} else {
			    upgradeUtils.markUserUpgradeEventStatus( userUpgradeEvent, 'success', null, function(err) {
			    	if ( err ) {
			    		callback( err );

			    	} else {
							upgradeUtils.updateUserAccountStatus( user, false, callback );
						}
			    });
				}
			});
		}
	});
}

//promotionType should be either 'chromeStoreReview' or 'facebookLike'
exports.creditPromotionAction = function( user, promotionType, callback ) {

	if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
	if ( ! promotionType ) { callback( winston.makeMissingParamError('promotionType') ); return; }

	if ( ( promotionType != constants.PROMOTION_TYPE_CHROMESTORE_REVIEW ) && ( promotionType != constants.PROMOTION_TYPE_FACEBOOK_LIKE ) ) {
		callback( winston.makeError('invalid promotionType', {promotionType: promotionType}) );

	} else if ( ( promotionType == constants.PROMOTION_TYPE_CHROMESTORE_REVIEW ) && user.clickedChromeStoreReview ) {
		winston.doWarn('user already clicked chromeStoreReview', {userId: user._id});
		callback();

	} else if ( ( promotionType == constants.PROMOTION_TYPE_FACEBOOK_LIKE ) && user.clickedFacebookLike ) {
		winston.doWarn('user already clicked facebookLike', {userId: user._id});
		callback();

	} else {
		var updateData = {$set: {}};

		if ( promotionType == constants.PROMOTION_TYPE_CHROMESTORE_REVIEW ) {
			user.clickedChromeStoreReview = true;
			updateData['$set']['clickedChromeStoreReview'] = true;

		} else if ( promotionType == constants.PROMOTION_TYPE_FACEBOOK_LIKE ) {
			user.clickedFacebookLike = true;
			updateData['$set']['clickedFacebookLike'] = true;
		}

	  UserModel.findByIdAndUpdate( user._id, updateData, function(mongoErr) {
	  	if ( mongoErr ) {
	  		callback( winston.makeMongoError( mongoErr ) );
	  	
	  	} else {
	  		upgradeUtils.updateUserAccountStatus( user, false, callback );
	  	}
	  });
	}
}