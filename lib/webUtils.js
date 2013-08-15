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

  // check protocol - only http, https can be processed
  if (!urlUtils.hasValidProtocol (url)) {
    callback (winston.makeRequestError ('invalid protocol', {url : url}));
    return;
  }

  var hasHandled = false;
  var request;

  if ( urlUtils.isHTTPS( url ) ) {

    var parsedURL = urlUtils.parseURL( url );
    var options = {
        host: parsedURL.host
      , port: 443
      , path: parsedURL.path
      , method: 'GET'
    }

    try {
      request = https.get( options, function( response ) {
        if ( hasHandled ) {
          winston.doWarn('double response from https get');
        } else {
          hasHandled = true;
          exports.handleWebGetResponse( response, asBuffer, remainingRedirectsToFollow, url, originalURL, request, callback );
        }
      });
    } catch (e) {
      callback (winston.makeError('caught error https get', {stack : e.stack, message : e.message, url : url}));
    }


  } else {
    
    try {
      request = http.get( url, function( response ) {
        if ( hasHandled ) {
          winston.doWarn('double response from http get');
        } else {
          hasHandled = true;
          exports.handleWebGetResponse( response, asBuffer, remainingRedirectsToFollow, url, originalURL, request, callback );
        }
      });
    } catch (e) {
      callback (winston.makeError('caught error http get', {stack : e.stack, message : e.message, url : url}));
    }

  }

  if (request) {
    request.on( 'error', function( requestErr ) {
      if ( hasHandled ) {
        winston.doWarn('error, but double response from http get', {err : requestErr});
      } else {
        hasHandled = true;
        callback( winston.makeRequestError( requestErr ) );
      }
    });

    request.setTimeout (constants.DEFAULT_WEB_GET_TIMEOUT, function () {
      if (!hasHandled) {
        callback (winston.makeError ('request timed out, aborting', {url : url}));
        hasHandled = true;
        request.abort();
        request = null;
      }
    });
  }

}

exports.handleWebGetResponse = function( response, asBuffer, remainingRedirectsToFollow, url, originalURL, request, callback ) {

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
      callback( winston.makeError('response error', {responseCode: responseCode, url: url, originalURL: originalURL, suppressError : true}) );

    } else {

      if (utils.isWebResponseTooBig (response)) {
        winston.doWarn ('http webUtils response is too big, aborting');
        request.abort();
        callback (null, '', url, response.headers, true);
      } else {
        //we're good...
        if ( asBuffer ) {
          utils.streamToBuffer( response, true, function(err, buffer, isAborted) {
            if ( err ) {
              callback(err);

            } else if (isAborted) {
              request.abort();
              callback ( null, buffer, url, response.headers, isAborted );
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
}

exports.getPrintableResponseInfo = function( response, callback ) {
 
  if ( ! response ) {
    winston.doWarn('webUtils: getResponseInfo: no response');
    callback();

  } else {
    response.setEncoding ('utf8');
    var hasCalledBack = false;
    var info = '';

    if ( response.headers ) {
      info += 'HEADERS: ' + JSON.stringify( response.headers );
    }

    response.on('data', function (chunk) {
      if ( info ) {
        info += ', ';
      }
      info += 'BODY CHUNK: ' + chunk;
    });

    response.on('end', function () {
      if ( hasCalledBack ) {
        winston.doWarn('webUtils.getResponseInfo: already called back!');

      } else {
        hasCalledBack = true;
        callback( null, info );
      }
    });

    setTimeout( function() {
      if ( ! hasCalledBack ) {
        hasCalledBack = true;
        winston.doWarn('webUtils: getResponseInfo: never called back!');
        callback( null, info );
      }
    }, constants.RESPONSE_MAX_WAIT_MS );
  }
}