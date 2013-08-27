var serverCommon = process.env.SERVER_COMMON;

var attachmentUtils = require(serverCommon + '/lib/attachmentUtils');

describe('attachmentATTFile', function() {

  it( 'att false', function() {
    expect( attachmentUtils.isATTFile(  ) ).toBe( false );
    expect( attachmentUtils.isATTFile( 'any other thing' ) ).toBe( false );
    expect( attachmentUtils.isATTFile( 'ATT' ) ).toBe( false );
    expect( attachmentUtils.isATTFile( '1.txt' ) ).toBe( false );
    expect( attachmentUtils.isATTFile( 'ATT.txt' ) ).toBe( false );
    expect( attachmentUtils.isATTFile( 'ATT.txt' ) ).toBe( false );
    expect( attachmentUtils.isATTFile( 'ATT00001.jpg' ) ).toBe( false );
    expect( attachmentUtils.isATTFile( 'ATT00001.png' ) ).toBe( false );
    expect( attachmentUtils.isATTFile( 'ATT00001..png' ) ).toBe( false );
    expect( attachmentUtils.isATTFile( '00001..txt' ) ).toBe( false );
  });

  it( 'att true', function() {
    expect( attachmentUtils.isATTFile( 'ATT00001..txt' ) ).toBe( true );
    expect( attachmentUtils.isATTFile( 'ATT00002..txt' ) ).toBe( true );
    expect( attachmentUtils.isATTFile( 'ATT00212..txt' ) ).toBe( true );
    expect( attachmentUtils.isATTFile( 'att00001..txt' ) ).toBe( true );
    expect( attachmentUtils.isATTFile( 'ATT00001.txt' ) ).toBe( true );
    expect( attachmentUtils.isATTFile( 'ATT01537.txt' ) ).toBe( true );

    expect( attachmentUtils.isATTFile( 'ATT00001..htm' ) ).toBe( true );
    expect( attachmentUtils.isATTFile( 'ATT00001.htm' ) ).toBe( true );
    expect( attachmentUtils.isATTFile( 'ATT01537.htm' ) ).toBe( true );

    expect( attachmentUtils.isATTFile( 'ATT00001..html' ) ).toBe( true );
    expect( attachmentUtils.isATTFile( 'ATT00001.html' ) ).toBe( true );
    expect( attachmentUtils.isATTFile( 'ATT01537.html' ) ).toBe( true );

    expect( attachmentUtils.isATTFile( 'ATT00005.htm' ) ).toBe( true );
  });
})