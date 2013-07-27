var serverCommon = process.env.SERVER_COMMON;

var UserModel = require(serverCommon + '/schema/user').UserModel
	, UserUpgradeModel = require(serverCommon + '/schema/userUpgrade').UserUpgradeModel
	, ExtraDaysModel = require('../schema/extraDays').ExtraDaysModel
	, ReferralModel = require('../schema/referral').ReferralModel
  , winston = require(serverCommon + '/lib/winstonWrapper').winston
  , conf = require(serverCommon + '/conf')
  , constants = require ('../constants')
  , utils = require(serverCommon + '/lib/utils')
  , sqsConnect = require(serverCommon + '/lib/sqsConnect')
  , mailDownloadUtils = require(serverCommon + '/lib/mailDownloadUtils')
	, stripe = require('stripe')(conf.stripe.secretKey)


var upgradeUtils = this;

exports.chargeAndUpgradeUser = function( userEmail, stripeCardToken, billingPlan, callback ) {

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
			var userUpgrade = new UserUpgradeModel({
					userId: user._id
				, billingPlan: billingPlan
				, stripeCardToken: user.stripeCardToken
				, stripeCustomerId: user.stripeCustomerId
			});

			userUpgrade.save( function(mongoErr) {
				if ( mongoErr ) {
					callback( winston.makeMongoError( mongoErr ) );
					upgradeUtils.markUserUpgradeStatusFail( userUpgrade, 'userUpgradeSave' );

				} else {
					upgradeUtils.createUserUpgradeJob( user, stripeCardToken, billingPlan, userUpgrade, function(err) {
						if ( err ) {
							callback(err);
							upgradeUtils.markUserUpgradeStatusFail( userUpgrade, 'jobCreation' );

						} else {
							callback();
						}
					});
				}
			});
		}
	});
}

exports.createUserUpgradeJob = function( user, stripeCardToken, billingPlan, userUpgrade, callback ) {

	if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
	if ( ! stripeCardToken ) { callback( winston.makeMissingParamError('stripeCardToken') ); return; }
	if ( ! billingPlan ) { callback( winston.makeMissingParamError('billingPlan') ); return; }
	if ( ! userUpgrade ) { callback( winston.makeMissingParamError('userUpgrade') ); return; }

	var sqsMessage = {
    	jobType : 'userUpgrade'
    , userId: user._id
    , stripeCardToken: stripeCardToken
    , billingPlan: billingPlan
    , userUpgradeId: userUpgrade._id
  };

	sqsConnect.addMessageToWorkerQueue( sqsMessage, callback );
}

exports.doUserUpgradeJob = function( userUpgradeJob, callback ) {

	if ( ! userUpgradeJob ) { callback( winston.makeMissingParamError('userUpgradeJob') ); return; }
	if ( ! userUpgradeJob.userId ) { callback( winston.makeMissingParamError('userUpgradeJob.userId') ); return; }
	if ( ! userUpgradeJob.stripeCardToken ) { callback( winston.makeMissingParamError('userUpgradeJob.stripeCardToken') ); return; }
	if ( ! userUpgradeJob.billingPlan ) { callback( winston.makeMissingParamError('userUpgradeJob.billingPlan') ); return; }
	if ( ! userUpgradeJob.userUpgradeId ) { callback( winston.makeMissingParamError('userUpgradeJob.userUpgradeId') ); return; }

	var userId = userUpgradeJob.userId;
	var stripeCardToken = userUpgradeJob.stripeCardToken;
	var billingPlan = userUpgradeJob.billingPlan;
	var userUpgradeId = userUpgradeJob.userUpgradeId;

	UserUpgradeModel.findById( userUpgradeId, function(mongoErr, userUpgrade) {
		if ( mongoErr ) {
			callback( winston.makeMongoError(mongoErr) );

		} else if ( ! userUpgrade ) {
			callback( winston.makeError('no userUpgrade') );

		} else {
			UserModel.findById( userId, function(mongoErr, user) {
				if ( mongoErr ) {
					callback( winston.makeMongoError(mongoErr) );
					upgradeUtils.markUserUpgradeStatusFail( userUpgrade, 'userLookup' );

				} else if ( ! user ) {
					callback( winston.makeError('no user', {userId: userId}) );
					upgradeUtils.markUserUpgradeStatusFail( userUpgrade, 'noUser' );

				} else {
					upgradeUtils.setStripeCustomerData( user, stripeCardToken, function(err) {
						if ( err ) {
							callback( err );
							upgradeUtils.markUserUpgradeStatusFail( userUpgrade, 'setStripeCustomerData' );

						} else {
							var oldBillingPlan = user.billingPlan;
							user.billingPlan = billingPlan;
							user.billingPlanStartDate = Date.now();

							var updateData = {$set: {
					    		billingPlan: user.billingPlan
					    	, billingPlanStartDate: user.billingPlanStartDate
					    	, stripeCustomerId: user.stripeCustomerId
					    	, stripeCardToken: user.stripeCardToken
					    }};

					    UserModel.findByIdAndUpdate( userId, updateData, function(mongoErr) {
					    	if ( mongoErr ) {
					    		callback( winston.makeMongoError( mongoErr ) );
					    		upgradeUtils.markUserUpgradeStatusFail( userUpgrade, 'userUpdate' );

					    	} else {
									upgradeUtils.setStripeSubscription( user, function(err) {
										if ( err ) {
											callback( err );
											upgradeUtils.markUserUpgradeStatusFail( userUpgrade, 'setStripeSubscription' );

										} else {
									    upgradeUtils.markUserUpgradeStatus( userUpgrade, 'success', null, function(err) {
									    	if ( err ) {
									    		callback( err );

									    	} else {
													upgradeUtils.updateUserAccountStatus( user, callback );
												}
									    });
							    	}
							    });
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

exports.markUserUpgradeStatus = function( userUpgrade, status, failReason, callback ) {

	if ( ! userUpgrade ) { callback( winston.makeMissingParamError('userUpgrade') ); return; }
	if ( ! userUpgrade._id ) { callback( winston.makeMissingParamError('userUpgrade._id') ); return; }
	if ( ! status ) { callback( winston.makeMissingParamError('status') ); return; }

	userUpgrade.status = status;
	var userUpgradeUpdateData = {$set: {
		status: userUpgrade.status
	}};

	if ( failReason ) {
		userUpgradeUpdateData['$set']['failReason'] = failReason;
	}

	UserUpgradeModel.findByIdAndUpdate( userUpgrade._id, userUpgradeUpdateData, function(mongoErr) {
		if ( mongoErr ) {
			callback( winston.makeMongoError( mongoErr ) );

		} else {
			callback();
		}
	});
}

//Just marks fail and handles any error.  Useful for best-effort fail saving.
exports.markUserUpgradeStatusFail = function( userUpgrade, failReason ) {
	upgradeUtils.markUserUpgradeStatus( userUpgrade, 'fail', failReason, function(err) {
		if ( err ) {
			winston.handleError( err );
		}
	});
}

exports.updateUserAccountStatusByUserId = function( userId, callback ) {

	if ( ! userId ) { callback( winston.makeMissingParamError('userId') ); return; }

	UserModel.findById( userId, function(mongoErr, user) {
		if ( mongoErr ) {
			callback( winston.makeMongoError( mongoErr ) );

		} else if ( ! user ) {
			callback( winston.makeError('no user', {userId: userId}) );

		} else {
			upgradeUtils.updateUserAccountStatus( user, callback );
		}
	});
}

//This function makes sure the user has the appropriate benefits (e.g. extra days or premium)
exports.updateUserAccountStatus = function( user, callback ) {

	if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }

	upgradeUtils.updateUserIsPremium( user, function(err, isPremiumChanged) {
		if ( err ) {
			callback( err );

		} else {
			upgradeUtils.updateUserDaysLimit( user, function(err, daysLimitChanged) {
				if ( err ) {
					callback( err );

				} else if ( isPremiumChanged || ( ( ! user.isPremium ) && daysLimitChanged ) ) {
					mailDownloadUtils.createResumeDownloadNow( user, callback );

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