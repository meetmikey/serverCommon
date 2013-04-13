var serverCommon = process.env.SERVER_COMMON;

var http = require('http')
  , https = require('https')
  , constants = require('../constants')
  , winston = require('./winstonWrapper').winston

var webUtils = this;


//This is here as a convenience function since most of the time we'll want to use the
//default number of redirects, but don't want to specify a "null" value in the params.
exports.webGet = function( url, callback ) {
  //Pass null, so we use the default
  webUtils.webGetWithRedirects( url, null, callback );
}

exports.webGetWithoutRedirects = function( url, callback ) {
  urlUtils.webGetWithRedirects( url, 0, callback );
}

//numRedirectsToFollow is optional (can be passed as 'null' to use the default)
exports.webGetWithRedirects = function( url, numRedirectsToFollow, callback ) {

  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  var remainingRedirectsToFollow = constants.DEFAULT_NUM_REDIRECTS_TO_FOLLOW;

  if ( ( numRedirectsToFollow !== null )
    && ( numRedirectsToFollow !== undefined )
    && ( numRedirectsToFollow >= 0 ) ) {

    remainingRedirectsToFollow = numRedirectsToFollow;
  }

  urlUtils.webGetAttempt( url, remainingRedirectsToFollow, url, callback );
}

exports.webGetAttempt = function( url, remainingRedirectsToFollow, originalURL, callback ) {

  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  if ( urlUtils.isHTTPS( url ) ) {

    var parsedURL = urlUtils.parseURL( url );
    var options = {
        host: parsedURL.host
      , port: 443
      , path: parsedURL.path
      , method: 'GET'
    }

    https.get( options, function( response ) {
      exports.handleWebGetResponse( response, remainingRedirectsToFollow, url, originalURL, callback );

    }).on( 'error', function( err ) {
      callback( winston.makeRequestError( err ) );
    });

  } else {
    http.get( url, function( response ) {
      exports.handleWebGetResponse( response, remainingRedirectsToFollow, url, originalURL, callback );

    }).on( 'error', function( err ) {
      callback( winston.makeRequestError( err ) );
    });
  }
}

exports.handleWebGetResponse = function( response, remainingRedirectsToFollow, url, originalURL, callback ) {

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
        urlUtils.webGetAttempt( redirectURL, remainingRedirectsToFollow, originalURL, callback );
      }

    } else if ( response.statusCode >= 400 ) {
      callback( wiston.makeError('response error', {responseCode: responseCode, url: url, originalURL: originalURL}) );

    } else {
      //we're good...
      callback( null, response, url );
    }
  }
}
