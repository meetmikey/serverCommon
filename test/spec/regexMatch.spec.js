var utils = require('../../lib/utils');
var constants = require ('../../constants');

describe('regexMatch', function() {
  var matchArray = constants.URL_FILTER_REGEX;

  it('no match', function() {
    expect( utils.regexMatch('github.com/meetmikey/mikeyExtension', matchArray) ).toBe(false);
    expect( utils.regexMatch('github.com', matchArray) ).toBe(false);
    expect( utils.regexMatch('espn.com', matchArray) ).toBe(false);
  });

  it('match', function() {
    expect( utils.regexMatch('https://github.com/LearnBoost/knox/commit/c5c83d6bbfedc9bfd3a7b7d2e16dc053674f8a8b', matchArray) ).toBe(true);
    expect( utils.regexMatch('https://github.com/meetmikey/mikeymail/tree/b4d9ad450fecceb3cd6e2289d6e17b865f332540', matchArray) ).toBe(true);
    expect( utils.regexMatch('https://github.com/meetmikey/mikeymail/blob/b4d9ad450fecceb3cd6e2289d6e17b865f332540/constants.js', matchArray) ).toBe(true);
  });
});