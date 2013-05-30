var serverCommon = process.env.SERVER_COMMON;

var libURL = require('url')
  , utils = require(serverCommon + '/lib/utils')
  , constants = require('../constants')
  , urlLib = require ('url')
  , winston = require('./winstonWrapper').winston

var urlUtils = this;

exports.getHostname = function( url, keepWWW ) {
  if ( ! url ) {
    return '';
  }
  parsedURL = urlUtils.parseURL(url);
  if ( ! parsedURL ) {
    return '';
  }
  var hostname = parsedURL.hostname;
  if ( ! hostname ) {
    return '';
  }
  var wwwString = 'www.';
  if ( ( ! keepWWW ) && ( hostname.indexOf( wwwString ) === 0 ) ) {
    hostname = hostname.substring( wwwString.length );
  }
  return hostname;
}

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

exports.hasValidProtocol = function (url) {
  if (!url) {
    return false;
  }

  var validProtocols = ['http:','https:'];
  
  var parsed = urlLib.parse(url);

  if (parsed && parsed.protocol) {
    return (validProtocols.indexOf (parsed.protocol) !== -1)
  }
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

exports.cleanURLs = function(dirtyURLs) {
  var cleanURLs = [];
  if ( ( ! dirtyURLs ) || ( ! ( dirtyURLs.length > 0 ) ) ) {
    return cleanURLs;
  }
  for ( var i=0; i<dirtyURLs.length; i++ ) {
    cleanURL = urlUtils.cleanURL( dirtyURLs[i] );
    cleanURLs.push(cleanURL)
  }
  return cleanURLs;
}

exports.cleanURL = function(dirtyURL) {
  if ( ! dirtyURL ) { winston.doMissingParamError('dirtyURL'); return ''; }

  var cleanURL = dirtyURL.replace (/&amp;/g, "&");
  return cleanURL;
}

exports.getComparableURL = function( url ) {
  if ( ! url ) {
    return '';
  }

  var comparableURL = url.toLowerCase();
  comparableURL = comparableURL.trim();
  comparableURL = urlUtils.cleanURL(comparableURL);

  //Drop protocol...
  var protocolIndicator = '://';
  var protocolIndicatorIndex = comparableURL.indexOf( protocolIndicator );
  if ( protocolIndicatorIndex !== -1 ) {
    comparableURL = comparableURL.substring( protocolIndicatorIndex + protocolIndicator.length );
  }

  var prefixes = ['www.'];
  while ( urlUtils.urlStartsWithPrefix( comparableURL, prefixes ) ) {
    for ( var i=0; i<prefixes.length; i++ ) {
      var prefix = prefixes[i].toLowerCase();
      var comparablePrefix = comparableURL.substring( 0, prefix.length ).toLowerCase();
      if ( comparablePrefix == prefix ) {
        comparableURL = comparableURL.substring(prefix.length);
        comparableURL = comparableURL.trim();
        continue;
      }
    }
  }

  //Strip meaningless suffixes...
  var suffixes = ['/', '.', '#'];
  while ( urlUtils.urlEndsWithSuffix( comparableURL, suffixes ) ) {
    for ( var i=0; i<suffixes.length; i++ ) {
      var suffix = suffixes[i].toLowerCase();
      var comparableSuffix = comparableURL.substring( comparableURL.length - suffix.length ).toLowerCase();
      if ( comparableSuffix == suffix ) {
        comparableURL = comparableURL.substring(0, ( comparableURL.length - suffix.length ) );
        comparableURL = comparableURL.trim();
        continue;
      }
    }
  }

  comparableURL = comparableURL.trim();

  return comparableURL;
}

exports.urlStartsWithPrefix = function(url, prefixes) {

  if ( ! url ) {
    return false;
  }

  url = url.toLowerCase();

  for ( var i=0; i<prefixes.length; i++ ) {
    var prefix = prefixes[i].toLowerCase();
    if ( url.substring(0, prefix.length ) == prefix ) {
      return true;
    }
  }
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
    winston.doWarn('urlUtils: hashURL: blank url!');
    return '';
  }
  var hash = utils.getHash( url, 'sha256' );
  return hash;
}

exports.isYoutubeURL = function (url) {
  return (url.indexOf("youtube.com") !== -1)
}

exports.getYoutubeImageURL = function(url) {

  if ( ! url ) {
    return null;
  }

  var vParamIndex = url.indexOf("v=");
  if ( vParamIndex !== -1 ) {
    var parsedURL = libURL.parse(url, true);
    if ( parsedURL && parsedURL.query && parsedURL.query.v ) {
      var videoId = parsedURL.query.v;
      var imageURL = "http://img.youtube.com/vi/" + videoId + "/0.jpg";
      return imageURL;
    }
  }
  return null;
}

exports.parseURL = function(url) {
  if ( ! url ) {
    return '';
  }
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
    var viewFormIndicator = "viewform";
    if ( ( url.indexOf( formKeyIndicator ) !== - 1 ) || (  url.indexOf( viewFormIndicator ) !== - 1 ) ) {
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