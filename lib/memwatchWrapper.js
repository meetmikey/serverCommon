var memwatch = require('memwatch')
  , winston = require('./winstonWrapper').winston

memwatch.monitor = function(includeStats) {
  memwatch.on('leak', function(info) {
    winston.doError('memory leak', {info: info});
  });

  if ( includeStats ) {
    var heapDiff = new memwatch.HeapDiff();

    memwatch.on('stats', function(stats) { 
      winston.doInfo('STATS REPORT', {stats : stats});
      var diff = heapDiff.end();

      winston.doInfo('HEAP DIFF', {diff :diff});
      heapDiff = new memwatch.HeapDiff();
    });
  }
}

exports.memwatch = memwatch;