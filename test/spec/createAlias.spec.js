var serverCommon = process.env.SERVER_COMMON;

var esUtils = require (serverCommon + '/lib/esUtils')
  , appInitUtils = require(serverCommon + '/lib/appInitUtils')
  , conf = require (serverCommon + '/conf')
  , esConnect = require (serverCommon + '/lib/esConnect')
  , request = require ('request');

var initActions = [
    appInitUtils.CONNECT_ELASTIC_SEARCH
];

describe ('createAlias', function () {

  it ('alias', function () {

    appInitUtils.initApp( 'createAlias', initActions, conf, function() {

    
      var userId = 'testUser';

      esUtils.createAliasForUser (userId, function (err) {
        expect(err).toBe(null);

        // check to see if the index actually exists
        esConnect.checkAlias (userId, function (err) {
          expect(err).toBe(null);
        });

      });

    })

  });
});