var serverCommon = process.env.SERVER_COMMON;

var crypto = require('crypto')
  , constants = require('../constants')
  , winston = require (serverCommon + '/lib/winstonWrapper')

var mongoUtils = this;

exports.getShardKeyHash = function(input) {
  if ( ! input ) {
    winston.warn('mongoUtils: getShardKeyHash: missing input!');
    return '';
  }

  var shaHash = crypto.createHash('md5');
  shaHash.update( input.toString() );
  var hash = shaHash.digest('hex');
  var shardKey = hash.substring( 0, constants.SHARD_KEY_LENGTH );
  return shardKey;
}
