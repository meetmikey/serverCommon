var utils = require('../../lib/utils');


describe('utils', function() {

  it('isArray', function() {
    expect( utils.isArray() ).toBe( false );
    expect( utils.isArray(null) ).toBe( false );
    expect( utils.isArray(undefined) ).toBe( false );
    expect( utils.isArray({}) ).toBe( false );
    expect( utils.isArray({'some':'thing'}) ).toBe( false );
    expect( utils.isArray('hi') ).toBe( false );
    expect( utils.isArray(0) ).toBe( false );
    expect( utils.isArray(1) ).toBe( false );

    expect( utils.isArray([]) ).toBe( true );
    expect( utils.isArray(['a', 'b']) ).toBe( true );
    expect( utils.isArray(['a', 'b', 1]) ).toBe( true );
    expect( utils.isArray([1, 2]) ).toBe( true );
  });


  it('isObject', function() {
    expect( utils.isObject() ).toBe( false );
    expect( utils.isObject(null) ).toBe( false );
    expect( utils.isObject(undefined) ).toBe( false );
    expect( utils.isObject('hi') ).toBe( false );
    expect( utils.isObject(0) ).toBe( false );
    expect( utils.isObject(1) ).toBe( false );
    expect( utils.isObject([]) ).toBe( false );
    expect( utils.isObject(['a', 'b']) ).toBe( false );
    expect( utils.isObject(['a', 'b', 1]) ).toBe( false );
    expect( utils.isObject([1, 2]) ).toBe( false );

    expect( utils.isObject({}) ).toBe( true );
    expect( utils.isObject({'some':'thing'}) ).toBe( true );
    expect( utils.isObject({'some':'thing', 'foo': 'bar'}) ).toBe( true );
  });
});