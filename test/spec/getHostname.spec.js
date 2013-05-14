var urlUtils = require('../../lib/urlUtils');

describe('getHostname', function() {
  it('no www', function() {
    expect( urlUtils.getHostname('http://www.example.com/some/thing') ).toBe('example.com');
    expect( urlUtils.getHostname('https://www.example.com/some/thing') ).toBe('example.com');
    expect( urlUtils.getHostname('http://www.example.com/some/thing?var=val&var2=val2') ).toBe('example.com');
    expect( urlUtils.getHostname('http://www.new.com/some/thing?var=val&var2=val2') ).toBe('new.com');
    expect( urlUtils.getHostname('http://new.com/some/thing?var=val&var2=val2') ).toBe('new.com');
    expect( urlUtils.getHostname('http://new2.org/some/thing?var=val&var2=val2') ).toBe('new2.org');
    expect( urlUtils.getHostname('http://new2.org:1234/some/thing?var=val&var2=val2') ).toBe('new2.org');
    expect( urlUtils.getHostname('http://www1.new2.org:1234/some/thing?var=val&var2=val2') ).toBe('www1.new2.org');
    expect( urlUtils.getHostname('http://some.www.new2.org:1234/some/thing?var=val&var2=val2') ).toBe('some.www.new2.org');
  });

  it('keep www', function() {
    expect( urlUtils.getHostname('http://www.example.com/some/thing', true) ).toBe('www.example.com');
  });
});