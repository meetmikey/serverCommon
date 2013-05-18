var serverCommon = process.env.SERVER_COMMON;

var urlUtils = require (serverCommon + '/lib/urlUtils');

describe ('hasValidProtocol', function () {
  it ('bad proto', function () {
    var dirtyURL = 'mailto:?subject=&body=http%3A%2F%2Fwww.whyisrael.org%2F2012%2F10%2F16%2Fto-counter-christian-anti-israelism-its-time-to-go-local%2F';
    expect( urlUtils.hasValidProtocol( dirtyURL ) ).toBe( false );
  });

  it ('good proto', function () {
    var goodURL = 'http://espn.com';
    expect( urlUtils.hasValidProtocol( goodURL ) ).toBe( true );
  });

});