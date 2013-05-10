var serverCommon = process.env.SERVER_COMMON;

var http = require('http')
  , https = require('https')
  , utils = require('./utils')
  , urlUtils = require('./urlUtils')
  , constants = require('../constants')
  , winston = require('./winstonWrapper').winston

var webUtils = this;


//This is here as a convenience function since most of the time we'll want to use the
//default number of redirects, but don't want to specify a "null" value in the params.
exports.webGet = function( url, asBuffer, callback ) {
  winston.doInfo('webGet', {url : url});

  //Pass null, so we use the default
  webUtils.webGetWithRedirects( url, asBuffer, null, callback );
}

exports.webGetWithoutRedirects = function( url, asBuffer, callback ) {
  winston.doInfo('webGetWithoutRedirects', {url : url});

  webUtils.webGetWithRedirects( url, asBuffer, 0, callback );
}

//numRedirectsToFollow is optional (can be passed as 'null' to use the default)
exports.webGetWithRedirects = function( url, asBuffer, numRedirectsToFollow, callback ) {

  winston.doInfo('webGetWithRedirects', {url : url});

  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  var remainingRedirectsToFollow = constants.DEFAULT_NUM_REDIRECTS_TO_FOLLOW;

  if ( ( numRedirectsToFollow !== null )
    && ( numRedirectsToFollow !== undefined )
    && ( numRedirectsToFollow >= 0 ) ) {

    remainingRedirectsToFollow = numRedirectsToFollow;
  }

  webUtils.webGetAttempt( url, asBuffer, remainingRedirectsToFollow, url, callback );
}

exports.webGetAttempt = function( url, asBuffer, remainingRedirectsToFollow, originalURL, callback ) {

  winston.doInfo('webGetAttempt', {url : url});

  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  var hasHandled = false;

  if ( urlUtils.isHTTPS( url ) ) {

    var parsedURL = urlUtils.parseURL( url );
    var options = {
        host: parsedURL.host
      , port: 443
      , path: parsedURL.path
      , method: 'GET'
    }

    var request = https.get( options, function( response ) {
      if ( hasHandled ) {
        winston.doWarn('double response from https get');
      } else {
        hasHandled = true;
        exports.handleWebGetResponse( response, asBuffer, remainingRedirectsToFollow, url, originalURL, callback );
      }

    }).on( 'error', function( requestErr ) {
      if ( hasHandled ) {
        winston.doWarn('error, but double response from https get');
      } else {
        hasHandled = true;
        callback( winston.makeRequestError( requestErr ) );
      }
    });

    request.setTimeout (constants.DEFAULT_WEB_GET_TIMEOUT, function () {
      if (!hasHandled) {
        callback (winston.makeError ('request timed out', {url : url}));
        hasHandled = true;
      }
    });

  } else {
    var request = http.get( url, function( response ) {
      if ( hasHandled ) {
        winston.doWarn('double response from http get');
      } else {
        hasHandled = true;
        exports.handleWebGetResponse( response, asBuffer, remainingRedirectsToFollow, url, originalURL, callback );
      }

    }).on( 'error', function( requestErr ) {
      if ( hasHandled ) {
        winston.doWarn('error, but double response from http get');
      } else {
        hasHandled = true;
        callback( winston.makeRequestError( requestErr ) );
      }
    });

    request.setTimeout (constants.DEFAULT_WEB_GET_TIMEOUT, function () {
      if (!hasHandled) {
        callback (winston.makeError ('request timed out', {url : url}));
        hasHandled = true;
      }
    });

  }
}

exports.handleWebGetResponse = function( response, asBuffer, remainingRedirectsToFollow, url, originalURL, callback ) {

  winston.doInfo('handleWebGetResponse', {url : url});


  if ( ! response ) {
    callback( winston.makeError('missing response' , {url: url, originalURL: originalURL}) );

  } else {
    var responseCode = response.statusCode;
    if ( ! responseCode ) {
      callback( winston.makeError('no response code', {url: url, originalURL: originalURL}) );

    } else if ( ( responseCode >= 300 ) && ( responseCode < 400 ) ) {

      if ( remainingRedirectsToFollow <= 0 ) {
        callback( winston.makeError('too many redirects', {url: url, originalURL: originalURL}) );

      } else if ( ( ! response.headers ) || ( ! response.headers.location ) ) {
        callback( winston.makeError('redirect code, but no location specified!') );

      } else {
        var redirectURL = response.headers.location;
        remainingRedirectsToFollow = remainingRedirectsToFollow - 1;
        winston.doInfo('redirecting', {originalURL: originalURL, redirectURL: redirectURL, remainingRedirectsToFollow: remainingRedirectsToFollow});
        webUtils.webGetAttempt( redirectURL, asBuffer, remainingRedirectsToFollow, originalURL, callback );
      }

    } else if ( response.statusCode >= 400 ) {
      callback( winston.makeError('response error', {responseCode: responseCode, url: url, originalURL: originalURL}) );

    } else {
      //we're good...
      if ( asBuffer ) {
        utils.streamToBuffer( response, function(err, buffer) {
          if ( err ) {
            callback(err);

          } else {
            callback( null, buffer, url, response.headers );
          }
        });

      } else {
        callback( null, response, url, response.headers );
      }
    }
  }
}