var sqsConnect = require('../../lib/sqsConnect')
  , constants = require('../../constants')

describe('waitTime', function() {

  it('waitTime exponential backoff', function() {
    var base = constants.QUEUE_WAIT_TIME_BASE;
    expect( sqsConnect.getWorkQueueWaitTime() ).toBe( base );
    expect( sqsConnect.getWorkQueueWaitTime(1) ).toBe( base );
    expect( sqsConnect.getWorkQueueWaitTime(2) ).toBe( base * (2) );
    expect( sqsConnect.getWorkQueueWaitTime(3) ).toBe( base * (2*2) );
    expect( sqsConnect.getWorkQueueWaitTime(4) ).toBe( base * (2*2*2) );
  });

  it('maxWaitTime', function() {
    expect( sqsConnect.getWorkQueueWaitTime(10000) ).toBe( constants.QUEUE_MAX_WAIT_TIME );
  });

});