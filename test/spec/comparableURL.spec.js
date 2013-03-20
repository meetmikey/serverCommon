var serverCommon = process.env.SERVER_COMMON;

var urlUtils = require(serverCommon + '/lib/urlUtils');

describe('comparableURL', function() {

  it( 'prefixes', function() {
    var input = 'charliekubal.com';
    var output = 'charliekubal.com';
    expect( urlUtils.getComparableURL( input ) ).toBe( output );
    expect( urlUtils.getComparableURL( 'www.' + input ) ).toBe( output );
  });

  it( 'suffixes', function() {
    var input = 'charliekubal.com';
    var output = 'charliekubal.com';
    expect( urlUtils.getComparableURL( input ) ).toBe( output );
    expect( urlUtils.getComparableURL( input + '/') ).toBe( output );
    expect( urlUtils.getComparableURL( input + '#') ).toBe( output );
    expect( urlUtils.getComparableURL( input + '.') ).toBe( output );
    expect( urlUtils.getComparableURL( input + '//.##./') ).toBe( output );
  });

  it( 'protocols', function() {
    var input = 'www.charliekubal.com';
    var output = 'charliekubal.com';

    expect( urlUtils.getComparableURL( input ) ).toBe( output );

    expect( urlUtils.getComparableURL( 'http://' + input ) ).toBe( output );

    expect( urlUtils.getComparableURL( 'https://' + input ) ).toBe( output );
  });
})