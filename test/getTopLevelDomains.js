var linkUtils = require('../lib/linkUtils')
  , winston = require('../lib/winstonWrapper').winston


var checkDomains = function(err, topLevelDomains) {
  if ( err ) {
    winston.handleError(err);

  } else if ( ( ! topLevelDomains ) || ( ! ( topLevelDomains.length > 0 ) ) ) {
    winston.doError('no top level domains!');

  } else {
    winston.doInfo('got domains', {numDomains: topLevelDomains.length});
  }
}

linkUtils.getValidTopLevelDomains( checkDomains );
linkUtils.getValidTopLevelDomains( checkDomains );
linkUtils.getValidTopLevelDomains( checkDomains );