var serverCommon = process.env.SERVER_COMMON;

var convertUtils = require(serverCommon + '/lib/convertUtils');

describe ('conversions', function () {
  it('decimalToHex', function () {
    expect( convertUtils.decimalToHex('1') ).toBe( '1' );
    expect( convertUtils.decimalToHex( 1 ) ).toBe( '1' );
    expect( convertUtils.decimalToHex( '29395061599395' ) ).toBe( '1abc12346ca3' );
  });

  it('hexToDecimal', function () {
    expect( convertUtils.hexToDecimal('0x1') ).toBe( '1' );
    expect( convertUtils.hexToDecimal( 1 ) ).toBe( '1' );
    expect( convertUtils.hexToDecimal( '1abc12346ca3' ) ).toBe( '29395061599395' );
  });

  it('backAndForth', function () {
  	expect( convertUtils.decimalToHex( convertUtils.hexToDecimal('1abc12346ca3') ) ).toBe( '1abc12346ca3' );
  	expect( convertUtils.hexToDecimal( convertUtils.decimalToHex('29395061599395') ) ).toBe( '29395061599395' );
  });
});