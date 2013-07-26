var serverCommon = process.env.SERVER_COMMON;

var UserModel = require(serverCommon + '/schema/user').UserModel
	, UserUpgradeModel = require(serverCommon + '/schema/userUpgrade').UserUpgradeModel
	, ExtraDaysModel = require('../schema/extraDays').ExtraDaysModel
  , winston = require(serverCommon + '/lib/winstonWrapper').winston
  , conf = require(serverCommon + '/conf')
  , constants = require ('../constants')
  , utils = require(serverCommon + '/lib/utils')
  , mailDownloadUtils = require(serverCommon + '/lib/mailDownloadUtils')
	, stripe = require('stripe')(conf.stripe.secretKey)


var upgradeUtils = this;

exports.chargeAndUpgradeUser = function( userEmail, billingPlan, stripeToken, callback ) {

	//TODO: do we always need a stripeToken?  Could be changing plans and using a previous token.

	if ( ! userEmail ) { callback( winston.makeMissingParamError('userEmail') ); return; }
	if ( ! billingPlan ) { callback( winston.makeMissingParamError('billingPlan') ); return; }
	if ( ! stripeToken ) { callback( winston.makeMissingParamError('stripeToken') ); return; }

	UserModel.findOne( {email: userEmail}, function(mongoErr, foundUser) {
		if ( mongoErr ) {
			callback( winston.makeMongoError(mongoErr) );

		} else if ( ! foundUser ) {
			callback( winston.makeError('no user', {email: userEmail}) );

		} else {
			upgradeUtils.getStripeCustomerId( foundUser, stripeToken, function(err, stripeCustomerId) {
				if ( err ) {
					callback( err );

				} else {
					var userUpgrade = new UserUpgradeModel({
							userId: foundUser._id
						, billingPlan: billingPlan
						, stripeCustomerId: stripeCustomerId
					});

					userUpgrade.save( function(mongoErr) {
						if ( mongoErr ) {
							callback( winston.makeMongoError( mongoErr ) );

						} else if ( foundUser.billingPlan && ( foundUser.billingPlan == billingPlan ) ) {
							//nothing to do...
							callback();

						} else {
							foundUser.billingPlan = billingPlan;
							foundUser.billingPlanStartDate = Date.now();
							foundUser.stripeToken = stripeToken;

							var updateData = {$set: {
					    		billingPlan: foundUser.billingPlan
					    	, billingPlanStartDate: foundUser.billingPlanStartDate
					    	, stripeToken: foundUser.stripeToken
					    }};

					    UserModel.findByIdAndUpdate( foundUser._id, updateData, function(mongoErr, updatedUser) {
					    	if ( mongoErr ) {
					    		callback( winston.makeMongoError( mongoErr ) );

					    	} else {
									upgradeUtils.startStripeSubscription( foundUser, function(err) {
										if ( err ) {
											callback( err );

										} else {
											//The charge succeeded, so let the user know.  Errors from here on out will just be logged.
											callback();

											upgradeUtils.updateUserAccountStatus( foundUser, function(err) {
												if ( err ) {
													winston.handleError(err);

												} else {
											    upgradeUtils.markUserUpgradeStatus( userUpgrade, 'success', function(err) {
											    	if ( err ) {
											    		winston.handleError(err);
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
	});
}

exports.startStripeSubscription = function( user, callback ) {
	if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
	if ( ! user.stripeCustomerId ) { callback( winston.makeMissingParamError('user.stripeCustomerId') ); return; }
	if ( ! user.stripeToken ) { callback( winston.makeMissingParamError('user.stripeToken') ); return; }
	if ( ! user.billingPlan ) { callback( winston.makeMissingParamError('user.billingPlan') ); return; }

	var stripeChargeData = {
		plan: user.billingPlan
	};

	stripe.customers.update_subscription( user.stripeCustomerId, stripeChargeData, function( err, customer ) {
		if ( err ) {
			callback( winston.makeError('stripeChargeError', {stripeError: err.message}) );

		} else {
			callback();
		}
	});
}

exports.markUserUpgradeStatus = function( userUpgrade, status, callback ) {
	if ( ! userUpgrade ) { callback( winston.makeMissingParamError('userUpgrade') ); return; }
	if ( ! userUpgrade._id ) { callback( winston.makeMissingParamError('userUpgrade._id') ); return; }
	if ( ! status ) { callback( winston.makeMissingParamError('status') ); return; }

	userUpgrade.status = status;
	var userUpgradeUpdateData = {$set: {
		status: userUpgrade.status
	}};

	UserUpgradeModel.findByIdAndUpdate( userUpgrade._id, userUpgradeUpdateData, function(mongoErr) {
		if ( mongoErr ) {
			callback( winston.makeMongoError( mongoErr ) );

		} else {
			callback();
		}
	});
}

exports.getStripeCustomerId = function( user, stripeToken, callback ) {
	if ( ! user ) { callback( winston.makeMissingParamError('user') ); return; }
	if ( ! stripeToken ) { callback( winston.makeMissingParamError('stripeToken') ); return; }

	if ( user.stripeCustomerId ) {
		callback( null, user.stripeCustomerId );

	} else {
		var stripeCustomerData = {
				email: user.email
			, card: stripeToken
			, description: utils.getFullName( user.firstName, user.lastName )
		};

		stripe.customers.create( stripeCustomerData, function( err, customer ) {
	    if ( err ) {
	       callback( winston.makeError('stripeError', {stripeError: err.message}) );

	    } else {
	    	var stripeCustomerId = customer.id;
		    user.stripeCustomerId = stripeCustomerId;
		    
		    var updateData = {$set: {
		    	stripeCustomerId: stripeCustomerId
		    }};

		    UserModel.findByIdAndUpdate( user._id, updateData, function(mongoErr, updatedUser) {
		    	if ( mongoErr ) {
		    		callback( winston.makeMongoError( mongoErr ) );

		    	} else {
						callback( null, stripeCustomerId );
		    	}
		    });
			}
	 	});
	}
}

exports.updateUserAccountStatusByUserId = function( userId, callback ) {

	if ( ! userId ) { callback( winston.makeMissingParamError('userId') ); return; }

	UserModel.findById( userId, function(mongoErr, foundUser) {
		if ( mongoErr ) {
			callback( winston.makeMongoError( mongoErr ) );

		} else if ( ! foundUser ) {
			callback( winston.makeError('no user', {userId: userId}) );

		} else {
			upgradeUtils.updateUserAccountStatus( foundUser, callback );
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
          user.daysLimit = upgradeUtils.calculateDaysLimit( foundReferrals, foundExtraDays );
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

exports.calculateDaysLimit = function( foundReferrals, foundExtraDays ) {
  var daysLimit = constants.BASE_DAYS_LIMIT
  
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