var googleUtils = require ('../lib/googleUtils');

googleUtils.getAccessToken ("514265596a9290970a000007", function (err, newAccessToken) {
  console.log (err);
  console.log (newAccessToken);
});
