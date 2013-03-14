var OAuth2 = require('oauth').OAuth2
    , mongoose = require ('./mongooseConnect').mongoose
    , conf = require ('../conf')
    , constants = require ('../constants')
    , winston = require ('./winstonWrapper').winston;

var UserModel = mongoose.model ('User');

exports.refresh = function (userId, callback) {

  UserModel.findById (userId, function (err, foundUser) {
    if (err) {
      callback (winston.makeMongoError("Error retrieving user", {userId : userId, err: err}));
    }
    else if (!foundUser) {
      callback (winston.makeError("Error: could not find user with id", {userId : userId}));
    }
    else {

      // if there is a token and it's fresh just return it
      if (foundUser.accessToken
        && (foundUser.expiresAt && foundUser.expiresAt < Date.now() - constants.ACCESS_TOKEN_UPDATE_TIME_BUFFER)) {
        callback (null, foundUser.accessToken);
      }
      else if (foundUser.refreshToken) {

        var authorizePath = 'https://accounts.google.com/o/oauth2/auth';
        var accessTokenPath = 'https://accounts.google.com/o/oauth2/token';
        var oauth2 = new OAuth2(conf.google.clientID, conf.google.clientSecret, '', authorizePath, accessTokenPath);


        oauth2.getOAuthAccessToken(foundUser.refreshToken,
          {grant_type: 'refresh_token', refresh_token: foundUser.refreshToken},
          function(error, accessToken, refreshToken, results) {

            if (error) {
              callback(winston.makeError ('Error getting refresh token from google', {error : error}));
              return;
            }

            var expiresAt = Date.now() + 1000*results.expires_in;

            callback (null, accessToken);

            foundUser.accessToken = accessToken;
            foundUser.expiresAt = expiresAt;

            foundUser.save (function (err) {
              if (err) {
                winston.makeMongoError ('Error: did not save new access token to user', {err  : err});
              }
            });
          });

      }
      else {
        callback (winston.makeError ('Error: user doesn\'t have a refreshToken or valid accessToken'));
      }

    }
  });

}