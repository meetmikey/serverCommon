var serverCommon = process.env.SERVER_COMMON;

var urlUtils = require (serverCommon + '/lib/urlUtils');

describe ('cleanURLs', function () {
  it ('1 url', function () {
    var dirtyURL = 'http://www.blah.com/some&amp;thing';
    var cleanURL = 'http://www.blah.com/some&thing';
    expect( urlUtils.cleanURL( cleanURL ) ).toBe( cleanURL );

    expect( urlUtils.cleanURL( dirtyURL ) ).toBe( cleanURL );

    dirtyURL = 'http://www.blah.com/some&amp;thing/some&amp;/other/&thing';
    cleanURL = 'http://www.blah.com/some&thing/some&/other/&thing';
    expect( urlUtils.cleanURL( dirtyURL ) ).toBe( cleanURL );
  });

  it ('array of urls', function () {
    var dirtyURL1 = 'http://www.blah.com/some&amp;thing';
    var cleanURL1 = 'http://www.blah.com/some&thing';

    var dirtyURL2 = 'http://www.blah.com/some&amp;thi&amp;ng';
    var cleanURL2 = 'http://www.blah.com/some&thi&ng';

    var dirtyURLs = [dirtyURL1, dirtyURL2];
    var cleanURLs = [cleanURL1, cleanURL2];

    var outputCleanURLs = urlUtils.cleanURLs( dirtyURLs );
    expect( outputCleanURLs.length ).toBe(2);
    for ( var i=0; i<outputCleanURLs.length; i++ ) {
      expect( outputCleanURLs[i] ).toBe( cleanURLs[i] );
    }
  });

});