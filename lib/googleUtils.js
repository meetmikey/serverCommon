var OAuth2 = require('oauth').OAuth2
    , mongoose = require ('./mongooseConnect').mongoose
    , conf = require ('../conf')
    , constants = require ('../constants')
    , winston = require ('./winstonWrapper').winston;

var UserModel = mongoose.model ('User');

var googleUtils = this;

exports.getAccessToken = function (userId, callback) {
  UserModel.findById (userId, function (err, foundUser) {
    if (err) {
      callback (winston.makeMongoError("Error retrieving user", {userId : userId, err: err}));
    }
    else if (!foundUser) {
      callback (winston.makeError("Error: could not find user with id", {userId : userId}));
    }
    else if (foundUser.invalidToken) {
      googleUtils.callbackInvalidTokenError(callback);
    }
    else {
      var isoNowPlusBuffer = new Date(Date.now() - constants.ACCESS_TOKEN_UPDATE_TIME_BUFFER).toISOString();

      // if there is a token and it's fresh just return it
      if (foundUser.accessToken && (foundUser.expiresAt && foundUser.expiresAt < isoNowPlusBuffer)) {
        winston.doInfo ('access token still valid', {expires: foundUser.expiresAt});
        callback (null, foundUser.accessToken);
      }
      else if (foundUser.refreshToken) {
        winston.doInfo ('getting a new accessToken', {expires: foundUser.expiresAt});

        var authorizePath = 'https://accounts.google.com/o/oauth2/auth';
        var accessTokenPath = 'https://accounts.google.com/o/oauth2/token';
        var oauth2 = new OAuth2(conf.google.appId, conf.google.appSecret, '', authorizePath, accessTokenPath);

        oauth2.getOAuthAccessToken(foundUser.refreshToken,
          {grant_type: 'refresh_token', refresh_token: foundUser.refreshToken},
          function(error, accessToken, refreshToken, results) {
            if (error && error.data) {
              var data;
              var invalidToken = false;

              try {
                data = JSON.parse (error.data);            
              } catch (e) {
                if (error.statusCode === 400 && error.data.indexOf ('Error processing OAuth 2 request')!== -1) {
                  winston.doWarn ('error data from google wasn\'t JSON');
                  invalidToken = true;
                } else {
                  return callback (winston.makeError ('Error getting refresh token from google', {error : error}));
                }
              }

              if ((data && data.error === 'invalid_grant') || invalidToken) {
                winston.doWarn ('Error getting refresh token from google', {error : error, userEmail : foundUser.email});
                foundUser.invalidToken = true;
                foundUser.save (function (err) {
                  if (err) {
                    callback (winston.makeMongoError (err));
                  } else {
                    googleUtils.callbackInvalidTokenError(callback);
                  }
                });
              } else {
                callback(winston.makeError ('Error getting refresh token from google', {error : error}));
              }
            } else if (!accessToken || !results) {
                callback(winston.makeError ('Error getting access token from google - no access token or result',
                  {accessToken : accessToken, results : results}));
            } else {

              var expiresAt = Date.now() + 1000*results.expires_in;
              callback (null, accessToken);

              foundUser.accessToken = accessToken;
              foundUser.expiresAt = expiresAt;

              foundUser.save (function (err) {
                if (err) {
                  winston.makeMongoError ('Error: did not save new access token to user', {err  : err});
                }
              });
            }

          });
      }
      else {
        callback (winston.makeError ('Error: user doesn\'t have a refreshToken or valid accessToken'));
      }

    }
  });

}


exports.callbackInvalidTokenError = function (callback) {
  winston.doWarn ('invalid token error');
  var errorExtra = { suppressError : true, deleteFromQueue : true, errorType : 'invalid_grant' };
  var winstonError = winston.makeError ('user has revoked token', errorExtra);
  callback(winstonError);
}
