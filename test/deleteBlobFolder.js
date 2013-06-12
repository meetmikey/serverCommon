var azure = require('azure')
  , conf = require ('../conf')
  , async = require ('async')
  , winston = require('../lib/winstonWrapper').winston

var blobService = azure.createBlobService(conf.azure.storageAccount, conf.azure.storageAccessKey);

var container = process.argv [2];

deleteAllBatches (container);

function deleteAllBatches (container) {
  console.log ('delete all batches')
  var count = 0;

  function deleteBatchCallback (err, doMore) {
    console.log ('done with a batch', count++);
    if (err) {
      winston.doError ('error in batch', {err : err});
    } else if (doMore) {
      deleteBatch (container, deleteBatchCallback)
    } else {
      console.log ('all done with all batches')
    }
  }

  deleteBatch (container, deleteBatchCallback);

}

function deleteBatch (container, callback) {
  blobService.listBlobs (container, function (err, data) {
    if (err) {
      winston.doError('Could not list blobs in container', {container: container});
      return;
    }

    async.each (data, function (blob, forEachCb) {
      blobService.deleteBlob (container, blob.name, function (err, data) {
        if (err) {
          forEachCb (winston.makeError('Could not delete blob', {blobName: blob.name}));
        }
        else {
          forEachCb ();
        }
      });
    }, function (err) {
      console.log ('async all done')
      if (err) {
        callback (err);
      } else {
        console.log (data.length);
        if (data.length == 5000) {
          callback (null, true);
        } else {
          callback (null, false);
        }
      }
    });

  });  
}