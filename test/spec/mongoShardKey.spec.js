var mongoUtils = require('../../lib/mongoUtils')
  , constants = require('../../constants')

describe('shard key', function() {
  
  it("shard key exists", function() {
    var input = 'hello';
    var shardKey = mongoUtils.getShardKeyHash( input );
    expect( shardKey ).toBeTruthy();
    expect( shardKey.length ).toBe( constants.SHARD_KEY_LENGTH );
  });

  it("shard key consistent", function() {
    var input = 'hello';
    var shardKey1 = mongoUtils.getShardKeyHash( input );
    var shardKey2 = mongoUtils.getShardKeyHash( input );
    expect( shardKey1 ).toBe( shardKey2 );
  });

  it("shard key different", function() {
    var input1 = 'hi';
    var shardKey1 = mongoUtils.getShardKeyHash( input1 );
    var input2 = 'hello';
    var shardKey2 = mongoUtils.getShardKeyHash( input2 );
    expect( shardKey1 ).not.toBe( shardKey2 );
  });
});