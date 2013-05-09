var serverCommon = process.env.SERVER_COMMON;

var esUtils = require (serverCommon + '/lib/esUtils');

describe ('isHardFail', function () {
  it ('tika', function () {
    var esError = '{"error":"MapperParsingException[Failed to extract [100000] characters of text for [null]]; nested: TikaException[Unable to extract PDF content]; nested: IOException; nested: DataFormatException[incorrect header check]; ","status":400}, esStatus=400, esError=MapperParsingException[Failed to extract [100000] characters of text for [null]]; nested: TikaException[Unable to extract PDF content]; nested: IOException; nested: DataFormatException[incorrect header check];'
    expect( esUtils.isHardFail( esError ) ).toBe( true );
  });


  it ('good response', function () {
    var esError = '{"node unavailable or something"}'
    expect( esUtils.isHardFail( esError ) ).toBe( false );
  });

  it ('gif', function () {
    var esError = '"RemoteTransportException[[Blue Marvel][inet[/10.76.190.41:9300]][index]]; nested: MapperParsingException[Failed to extract [100000] characters of text for [null]]; nested: TikaException[image/gif parse error]; nested: IIOException[I/O error reading header!]; nested: EOFException; "'
    expect( esUtils.isHardFail( esError ) ).toBe( true );
  });


});