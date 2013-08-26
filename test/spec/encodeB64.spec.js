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
    expectedEncoded = 'eyJldmVudCI6ImUtbWFpbCBvcGVuZWQiLCJwcm9wZXJ0aWVzIjp7ImRpc3RpbmN0X2lkIjoidXNlckBtaXhwYW5lbC5jb20iLCJ0b2tlbiI6ImUzYmM0MTAwMzMwYzM1NzIyNzQwZmI4YzZmNVhYWFhYIiwidGltZSI6MTI0NTYxMzg4NSwiY2FtcGFpZ24iOiJlbXBsb3llZSB3ZWxsbmVzcyJ9fQ==';
    encoded = utils.encodeB64( data );
    expect( encoded ).toBe( expectedEncoded ); //not sure my comparison value is actually correct here.
  });
});