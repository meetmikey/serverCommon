var serverCommon = process.env.SERVER_COMMON;

var constants = require('../constants')
  , winston = require (serverCommon + '/lib/winstonWrapper').winston
  , utils = require('./utils')

var mongoUtils = this;

exports.getShardKeyHash = function(input) {
  if ( ! input ) {
    winston.doError('mongoUtils: getShardKeyHash: missing input!');
    return '';
  }

  var hash = utils.getHash( input.toString(), 'md5' );
  var shardKey = hash.substring( 0, constants.SHARD_KEY_LENGTH );
  return shardKey;
}