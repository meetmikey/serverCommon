var azure = require('azure')
  , winston = require('../lib/winstonWrapper').winston

var blobService = azure.createBlobService('portalvhdsmh1jckv1x925m', '+83U9Cnm0m/iG4zvcWL53eewbBkETFNVCVhSruu+D21MCXu/pso1hb+QBaaRC0204SfJ78vLw8el+Zi+gqdWcA==');

var container = process.argv [2];

blobService.listBlobs (container, function (err, data) {
  if (err) {
    winston.doError('Could not list blobs in container', {container: container});
    return;
  }

  winston.doInfo('data length', {dataLength: data.length});

});