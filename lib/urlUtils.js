var serverCommon = process.env.SERVER_COMMON;

var libURL = require ('url')
  , utils = require(serverCommon + '/lib/utils')
  , request = require('request')
  , winston = require('./winstonWrapper').winston

var urlUtils = this;

exports.isImageURL = function(url) {
  if ( ! url ) {
    return false;
  }
  var imageSuffixes = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'raw', 'svg', 'tiff'];
  var dotSuffixIndex = url.lastIndexOf('.');
  if ( dotSuffixIndex !== - 1 ) {
    var suffix = url.substring(dotSuffixIndex + 1);
    if ( imageSuffixes.indexOf(suffix) !== -1 ) {
      return true;
    }
  }
  return false;
}

exports.addProtocolIfMissing = function(url) {
  if ( ! url ) {
    return '';
  }

  url = url.trim();
  var protocols = ['http://','https://'];
  var hasProtocol = false;
  for ( var i=0; i<protocols.length; i++ ) {
    var protocol = protocols[i];
    if ( url.substring(0, protocol.length) == protocol ) {
      hasProtocol = true;
      break;
    }
  }
  if ( ! hasProtocol ) {
    url = 'http://' + url;
  }
  return url;
}

exports.isYoutubeURL = function (url) {
  return (url.indexOf("youtube.com") !== -1)
}

exports.getFixedYoutubeURL = function (url) {

  //youtube hack:
  //fix youtube mobile site url's 
  //http://m.youtube.com/watch?v=P_i1xk07o4g&desktop_uri=/watch?v=P_i1xk07o4g
  //turns into http://youtube.com/watch?v=P_i1xk07o4g
  if(url.indexOf("m.youtube.com") !== -1){
    //find the desktop uri 
    var offset = url.indexOf("desktop_uri=/")

    if (offset !== -1) {
      url = "http://youtube.com/" + url.substring(offset + 13)
    }
  }
  else if(url.indexOf("youtube.com") !== -1) {

    var parsedUrl = libURL.parse(url, true)
    var videoId = parsedUrl.query.v
    url = "http://www.youtube.com/watch?v=" + videoId
  }

  return url
}

exports.getYoutubeImage = function(url) {
  var vParamIndex = url.indexOf("v=");
  if ( vParamIndex !== -1 ) {
    var parsedURL = libURL.parse(url, true);
    var id = parsedURL.query.v;
    var image = "http://img.youtube.com/vi/" + id + "/0.jpg";
    return image;
  }
  return null;
}

exports.parseURL = function(url) {
  return libURL.parse(url);
}

exports.isPDF = function(url) {
  return utils.endsWith(url, '.pdf');
}

exports.isGoogleDoc = function(url) {
  var googleDocsPattern = /(https:\/\/)?(.*\.)?docs.google.com.*/g;
  var isGoogleDoc = googleDocsPattern.test( url );
  return isGoogleDoc;
}

exports.lastToken = function(url) {
  var split = url.split('/')
  return split[split.length-1]
}

exports.isHTTPS = function(url) {
  var isHTTPS = false;
  if ( url && ( url.indexOf('https://') === 0 ) ) {
    isHTTPS = true;
  }
  return isHTTPS;
}

//Follow the link through redirects...
exports.resolveURL = function(url, callback) {

  if ( ! url ) { callback( winston.makeMissingParamError('url') ); return; }

  if ( urlUtils.isYoutubeURL(url) ) {
    url = urlUtils.getFixedYoutubeURL(url);
  }

  request( url,
    function (error, response, body) {

      if ( error || ( ! response ) || ( response.statusCode !== 200 ) ) {
        callback( winston.makeError('error resolving URL', {url: url, response: response}) );

      } else if ( ( ! response.request ) || ( ! response.request.href ) ) {
        callback( winston.makeError('no request.href while resolving URL') );

      } else {
        var resolvedURL = response.request.href;
        var isHTTPS = urlUtils.isHTTPS( response.request.href );
        callback( null, resolvedURL, isHTTPS, response );
      }
    }
  );
}