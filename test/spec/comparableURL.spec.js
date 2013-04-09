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

  it ('ampersand', function () {
    var input = 'google.com/search?client=ubuntu&amp;channel=fs&amp;q=supervised+topic+models&amp;ie=utf-8&amp;oe=utf-8#hl=en&amp;safe=off&amp;client=ubuntu&amp;hs=A2c&amp;channel=fs&amp;biw=1301&amp;bih=678&amp;sclient=psy-ab&amp;q=supervised+lda&amp;oq=supervised+lda&amp;gs_l=serp.3..0l4.29171.31722.0.31997.15.14.0.1.1.2.242.1701.6j7j1.14.0...0.0...1c.1.8.psy-ab.PaBtukOugHc&amp;pbx=1&amp;bav=on.2%2cor.r_cp.r_qf.&amp;bvm=bv.44990110%2cd.dmQ&amp;fp=e6d7ac674c50740c'
    var output = 'google.com/search?client=ubuntu&channel=fs&q=supervised+topic+models&ie=utf-8&oe=utf-8#hl=en&safe=off&client=ubuntu&hs=A2c&channel=fs&biw=1301&bih=678&sclient=psy-ab&q=supervised+lda&oq=supervised+lda&gs_l=serp.3..0l4.29171.31722.0.31997.15.14.0.1.1.2.242.1701.6j7j1.14.0...0.0...1c.1.8.psy-ab.PaBtukOugHc&pbx=1&bav=on.2%2cor.r_cp.r_qf.&bvm=bv.44990110%2cd.dmQ&fp=e6d7ac674c50740c'

    expect( urlUtils.getComparableURL( input ) ).toBe( output );

    expect( urlUtils.getComparableURL( 'http://' + input ) ).toBe( output );

    expect( urlUtils.getComparableURL( 'https://' + input ) ).toBe( output );


  });
})