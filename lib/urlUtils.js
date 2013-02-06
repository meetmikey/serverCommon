var serverCommon = process.env.SERVER_COMMON;

var libURL = require ('url')
  , utils = require(serverCommon + '/lib/utils')

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

exports.parse = function(url) {
  return libURL.parse(url);
}

exports.isPDF = function(url) {
  return utils.endsWith(url, '.pdf');
}