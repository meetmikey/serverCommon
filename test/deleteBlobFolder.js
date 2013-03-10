var azure = require('azure');

var blobService = azure.createBlobService('portalvhdsmh1jckv1x925m', '+83U9Cnm0m/iG4zvcWL53eewbBkETFNVCVhSruu+D21MCXu/pso1hb+QBaaRC0204SfJ78vLw8el+Zi+gqdWcA==');

var container = process.argv [2];

blobService.listBlobs (container, function (err, data) {
  if (err) {
    console.error ('Could not list blobs in container', container);
    return;
  }

  data.forEach (function (blob) {
    blobService.deleteBlob (container, blob.name, function (err, data) {
      if (err) {
        console.error ('Could not delete blob', blob.name);
      }
      else {
        console.log ('deleted blob', blob.name);
      }
    });
  });

});