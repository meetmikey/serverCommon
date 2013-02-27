var serverCommon = process.env.SERVER_COMMON;

var libURL = require ('url')
  , utils = require(serverCommon + '/lib/utils')
  , request = require('request')
  , winston = require('./winstonWrapper').winston
  , crypto = require('crypto')

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

exports.getComparableURLHash = function(url) {
  if ( ! url ) {
    winston.doMissingParamError('url');
    return '';
  }
  var comparableURL = urlUtils.getComparableURL( url );
  var urlHash = urlUtils.hashURL( comparableURL );
  return urlHash;
}

exports.getComparableURL = function( url ) {
  if ( ! url ) {
    return '';
  }

  comparableURL = url.trim();

  //Drop protocol...
  var protocolIndicator = '://';
  var protocolIndicatorIndex = url.indexOf( protocolIndicator );
  if ( protocolIndicatorIndex !== -1 ) {
    comparableURL = url.substring( protocolIndicatorIndex + protocolIndicator.length );
  }

  //toLowerCase...
  if ( comparableURL ) {
    comparableURL = comparableURL.toLowerCase().trim();
  }

  //Strip meaningless suffixes...
  var suffixes = ['/', '.', '#'];
  while ( urlUtils.urlEndsWithSuffix( comparableURL, suffixes ) ) {
    for ( var i=0; i<suffixes.length; i++ ) {
      var suffix = suffixes[i].toLowerCase();
      if ( comparableURL.substring( comparableURL.length - suffix.length ) == suffix ) {
        comparableURL = comparableURL.substring(0, ( comparableURL.length - suffix.length ) );
        comparableURL = comparableURL.trim();
        continue;
      }
    }
  }

  return comparableURL;
}


exports.urlEndsWithSuffix = function(url, suffixes) {

  if ( ! url ) {
    return false;
  }

  url = url.toLowerCase();

  for ( var i=0; i<suffixes.length; i++ ) {
    var suffix = suffixes[i].toLowerCase();
    if ( url.substring( url.length - suffix.length ) == suffix ) {
      return true;
    }
  }
  return false;
}

exports.hashURL = function(url) {
  if ( ! url ) {
    winston.warn('urlUtils: hashURL: blank url!');
    return '';
  }

  var shaHash = crypto.createHash('sha256');
  shaHash.update( url );
  var hash = shaHash.digest('hex');
  return hash;
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
  if ( isGoogleDoc ) {
    var formKeyIndicator = "formkey=";
    if ( url.indexOf( formKeyIndicator ) !== - 1) {
      //This is a google form, not really a google doc.
      isGoogleDoc = false;
    }
  }
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
        callback( winston.makeError('error resolving URL', {url: url}) );

      } else if ( ( ! response.request ) || ( ! response.request.href ) ) {
        callback( winston.makeError('no request.href while resolving URL', {url: url}) );

      } else {
        var resolvedURL = response.request.href;
        var isHTTPS = urlUtils.isHTTPS( response.request.href );
        callback( null, resolvedURL, isHTTPS, response );
      }
    }
  );
}

exports.extractGoogleDocId = function( url ) {
  //Examples...
  //https://docs.google.com/document/d/1dBuTwltPMsWZYsYT7U2L1TCeAfe6mzPz0h9F2UOCwMc/edit
  //https://docs.google.com/a/magicnotebook.com/document/d/1zFjgf3jnrOlxLP2iZgcwsbL0_PzcarQS_iiDjwWzRC4/edit
  //https://docs.google.com/a/magicnotebook.com/document/d/1CTNXkbYe_XIpFFb7qvEP0IVLEBxjBJye5-gEIGtFQhE/edit
  //https://docs.google.com/a/magicnotebook.com/spreadsheet/ccc?key=0AhPhYTrv0Xu4dFJLTUdBbHRzdE1IMGotUjl4Z2lVSlE#gid=0
  //https://docs.google.com/a/magicnotebook.com/spreadsheet/viewform?formkey=dHpkTHFONGlfSnRJWk5LVkd4dXVVS1E6MQ#gid=0
  //https://docs.google.com/spreadsheet/viewform?formkey=dDNrNk1MYXFudl9KV1NnTVZ5b3doRWc6MA#gid=0
  //https://docs.google.com/forms/d/1AIV2A-8ye9wGOY5AskXjgIjmbfiphaG-T4R8YJqvasQ/viewform
  //https://docs.google.com/a/magicnotebook.com/spreadsheet/viewform?formkey=dEJPaUNob2puTXNpT05SVUdvelo2emc6MQ#gid=0
  //https://docs.google.com/a/magicnotebook.com/spreadsheet/viewform?fromEmail=true&formkey=dG1vZXU2ZTA4Q0RQRW5XU1l3UTdCNXc6MQ
  //https://docs.google.com/a/magicnotebook.com/spreadsheet/ccc?key=0ApNID4-ZqEs1dHA4QW90VnJ5LXdEcWFSV3lmSnJiQnc&usp=sharing

  if ( ! url ) {
    return '';
  }

  var googleDocId = '';

  var dIndicator = '/d/';
  var dIndex = url.indexOf( dIndicator );

  var cccKeyIndicator = 'ccc?key=';
  var cccKeyIndex = url.indexOf( cccKeyIndicator );

  var formKeyIndicator = 'formkey=';
  var formKeyIndex = url.indexOf( formKeyIndicator );

  if ( dIndex !== -1 ) {
    googleDocId = url.substring( dIndex + dIndicator.length );

  } else if ( cccKeyIndex !== -1 ) {
    googleDocId = url.substring( cccKeyIndex + cccKeyIndicator.length );

  } else if ( formKeyIndex !== -1 ) {
    googleDocId = url.substring( formKeyIndex + formKeyIndicator.length ); 
  }
  if ( googleDocId ) {
    var slashIndicator = '/';
    var slashIndex = googleDocId.indexOf( slashIndicator );

    var hashIndicator = '#';
    var hashIndex = googleDocId.indexOf( hashIndicator );

    var ampersandIndicator = '&';
    var ampersandIndex = googleDocId.indexOf( ampersandIndicator );

    var questionIndicator = '&';
    var questionIndex = googleDocId.indexOf( questionIndicator );

    if ( slashIndex !== -1 ) {
      googleDocId = googleDocId.substring(0, slashIndex );

    } else if ( hashIndex !== -1 ) {
      googleDocId = googleDocId.substring(0, hashIndex );

    } else if ( ampersandIndex !== -1 ) {
      googleDocId = googleDocId.substring(0, ampersandIndex );

    } else if ( questionIndex !== -1 ) {
      googleDocId = googleDocId.substring(0, questionIndex );
    }
  }
  return googleDocId;
}