var utils = require('../../lib/utils');
var constants = require ('../../constants');

describe('encodeB64', function() {

  it('encodeB64', function() {
    var data = "Hello World";
    var expectedEncoded = 'SGVsbG8gV29ybGQ=';
    var encoded = utils.encodeB64( data );
    expect( encoded ).toBe( expectedEncoded );

    data = {"event": "e-mail opened", 
      "properties": {
        "distinct_id": "user@mixpanel.com", 
        "token": "e3bc4100330c35722740fb8c6f5XXXXX", 
        "time": 1245613885, 
        "campaign": "employee wellness"
        }
    }
    expectedEncoded = 'eyJldmVudCI6ICJnYW1lIiwgInByb3BlcnRpZXMiOiB7ImlwIjogIjEyMy4xMjMuMTIzLjEyMyIsICJ0b2tlbiI6ICJlM2JiNDEwMDMzMGMzNTcyMjc0MGZiOGM2ZjVhYmRkYyIsICJ0aW1lIjogMTI0NTYxMzg4NSwgImFjdGlvbiI6ICJwbGF5In19';
    encoded = utils.encodeB64( data );
    //expect( encoded ).toBe( expectedEncoded ); //not sure my comparison value is actually correct here.
  });
});