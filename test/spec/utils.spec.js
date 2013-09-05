var utils = require('../../lib/utils');


describe('utils', function() {

  it('isArray', function() {
    expect( utils.isArray(  )).toBe( false );
    expect( utils.isArray( null )).toBe( false );
    expect( utils.isArray( undefined )).toBe( false );
    expect( utils.isArray( {} )).toBe( false );
    expect( utils.isArray( {'some':'thing'} )).toBe( false );
    expect( utils.isArray( 'hi' )).toBe( false );
    expect( utils.isArray( 0 )).toBe( false );
    expect( utils.isArray( 1 )).toBe( false );

    expect( utils.isArray( [] )).toBe( true );
    expect( utils.isArray( ['a', 'b'] )).toBe( true );
    expect( utils.isArray( ['a', 'b', 1] )).toBe( true );
    expect( utils.isArray( [1, 2] )).toBe( true );
  });


  it('isObject', function() {
    expect( utils.isObject(  )).toBe( false );
    expect( utils.isObject( null )).toBe( false );
    expect( utils.isObject( undefined )).toBe( false );
    expect( utils.isObject( 'hi' )).toBe( false );
    expect( utils.isObject( 0 )).toBe( false );
    expect( utils.isObject( 1 )).toBe( false );
    expect( utils.isObject( [] )).toBe( false );
    expect( utils.isObject( ['a', 'b'] )).toBe( false );
    expect( utils.isObject( ['a', 'b', 1] )).toBe( false );
    expect( utils.isObject( [1, 2] )).toBe( false );

    expect( utils.isObject( {} )).toBe( true );
    expect( utils.isObject( {'some':'thing'} )).toBe( true );
    expect( utils.isObject( {'some':'thing', 'foo': 'bar'} )).toBe( true );
  });

  it('isNumber', function() {
    expect( utils.isNumber(  )).toBe( false );
    expect( utils.isNumber( null )).toBe( false );
    expect( utils.isNumber( undefined )).toBe( false );
    expect( utils.isNumber( 'hi' )).toBe( false );
    expect( utils.isNumber( [] )).toBe( false );
    expect( utils.isNumber( ['a', 'b'] )).toBe( false );
    expect( utils.isNumber( ['a', 'b', 1] )).toBe( false );
    expect( utils.isNumber( {} )).toBe( false );
    expect( utils.isNumber( {'some':'thing'} )).toBe( false );
    
    expect( utils.isNumber( 0) ).toBe( true );
    expect( utils.isNumber( 1) ).toBe( true );
    expect( utils.isNumber( 98746258975) ).toBe( true );
    expect( utils.isNumber( '98746258975') ).toBe( true );
  });

  it('isString', function() {
    expect( utils.isString(  )).toBe( false );
    expect( utils.isString( null )).toBe( false );
    expect( utils.isString( undefined )).toBe( false );
    expect( utils.isString( [] )).toBe( false );
    expect( utils.isString( ['a', 'b'] )).toBe( false );
    expect( utils.isString( ['a', 'b', 1] )).toBe( false );
    expect( utils.isString( {} )).toBe( false );
    expect( utils.isString( {'some':'thing'} )).toBe( false );
    expect( utils.isString( 0 )).toBe( false );
    expect( utils.isString( 1 )).toBe( false );
    expect( utils.isString( 98746258975 )).toBe( false );
    
    expect( utils.isString( 'hi' )).toBe( true );
    expect( utils.isString( '98746258975' )).toBe( true );
    expect( utils.isString( '' ) ).toBe( true );
    expect( utils.isString( new String('') )).toBe( true );
    expect( utils.isString( new String('asdf') )).toBe( true );
    expect( utils.isString( new String('987') )).toBe( true );
    expect( utils.isString( new String(987) )).toBe( true );
    expect( utils.isString( JSON.stringify({}) )).toBe( true );
    expect( utils.isString( JSON.stringify({'some':'thing'}) )).toBe( true );
  });
});