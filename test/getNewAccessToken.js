var googleUtils = require ('../lib/googleUtils');

googleUtils.refresh ("513fcef71cfc2ede5e000005", function (err, newAccessToken) {
  console.log (err);
  console.log (newAccessToken);
});