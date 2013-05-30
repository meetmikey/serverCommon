var memcache = require ('memcache'),
    async = require ('async'),
    winston = require ('./winstonWrapper').winston,
    conf = require ('../conf');

var client;
var clientConnected = false;

var memcachedConnect = this;

exports.init = function( callback ) {
  client = new memcache.Client(conf.memcached.port, conf.memcached.host);

  client.on('connect', function(){
    callback ();
    clientConnected = true;
  });

  client.on('close', function(){
    winston.doWarn ('memcached connection closed');
    clientConnected = false;
  });

  client.on('timeout', function(){
    // no arguments - socket timed out
    // TODO: reconnect?
    winston.doWarn ('memcached connection socket timeout');
    clientConnected = false;
  });

  client.on('error', function(err){
    // TODO: is this a javascript error object?
    winston.doError ('Error from memcached client', {err : err});
  });

  // connect to the memcache server after subscribing to some or all of these events
  client.connect();

}

exports.reconnect = function (callback) {
  // reinit
  memcachedConnect.init (function (err) {
    if (err) {
      callback (winston.makeError ('Memcached was disconnected and we could not reconnect'));
    } else {
      callback ();
    }
  });
}

exports.ensureConnected = function (callback) {
  if (!clientConnected) {
    memcachedConnect.reconnect (function (err) {
      if (err) { 
        callback (err);
      }
      else {
        callback ();
      }
    });
  } else {
    callback ();
  }
}


exports.set = function (object, callback) {

  memcachedConnect.ensureConnected (function (err) {
    if (err) { callback (err); return; }

    client.set(object._id, JSON.stringify (object), function(err, result){
      if (err) {
        callback (winston.makeError ('could not add object to memcached', {err : err, object : object}));
      } else {
        callback (null, result);
      }
    });
  });
}


exports.setBatch = function (objects, callback)  {
  winston.doInfo ('memcached: setBatch');

  memcachedConnect.ensureConnected (function (err) {
    if (err) { callback (err); return; }

    async.eachSeries (objects, function (object, asyncCb) {
      memcachedConnect.set (object, asyncCb);
    }, function (err) {
      if (err) {
        callback (err);
      } else {
        callback ();
      }
    });
  });
}

exports.get = function (keys, callback) {

  memcachedConnect.ensureConnected (function (err) {
    if (err) { callback (err); return; }

    client.get(keys, function(err, result){

      if (err) {
        callback (winston.makeError ('error memcached get', {err : err}));
        return;
      }
      else if (result && result == 'NOT_STORED') {
        callback ();
      }
      else {
        callback (null, result);
      }
    });
  });
}

exports.delete = function (key, callback) {
  memcachedConnect.ensureConnected (function (err) {
    if (err) { callback (err); return; }

    client.delete(key, function(err, result){
      if (err && err !== 'NOT_FOUND') {
        winston.doWarn ('error deleting key from memcached', {err : err});
        callback ();
        return;
      }

      callback (null, result);
    });
  });
}