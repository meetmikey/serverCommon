var serverCommon = process.env.SERVER_COMMON;

var mongoose = require('../lib/mongooseConnect').mongoose
  , winston = require('../lib/winstonWrapper').winston
  , conf = require('../conf')
  , appInitUtils = require('../lib/appInitUtils')
  , indexingHandler = require ('../lib/indexingHandler')
  , LinkModel = require('../schema/link').LinkModel
  
initActions = [
  appInitUtils.CONNECT_MONGO
];

var testLink = new LinkModel({
  "__v" : 1,
  "_id" : "51ba62c5de956c751800002e",
  "comparableURLHash" : "2fe4751cb8cca132e84f95f9565dbc9a809066fc62d7712ce7a7b424ee0222a9",
  "gmMsgHex" : "13eed0cb8ae5b9d0",
  "gmMsgId" : "1436314903805016528",
  "gmThreadId" : "1436314903805016528",
  "image" : "images/1db61775a62c658970cfeb1046c01292960f7866324eff7e2a3dd874182d94bc",
  "imageThumbExists" : true,
  "index" : [
    {
      "indexState" : "done",
      "version" : "v3",
      "_id" : "51ba62d88a12e1801800001c",
      "tries" : 1
    }
  ],
  "isDeleted" : false,
  "isFollowed" : true,
  "isPromoted" : true,
  "linkInfoId" : "51ba62886ed78605b33d06be",
  "mailCleanSubject" : "[StartX Community] Re: SF Office Space",
  "mailId" : "51ba6280bded436a1800054c",
  "recipients" : [
    {
      "name" : "community@startx.stanford.edu",
      "email" : "community@startx.stanford.edu"
    },
    {
      "name" : "Megan Harris",
      "email" : "megan@mepvc.com"
    }
  ],
  "sender" : {
    "name" : "Andrew Lockhart",
    "email" : "andrewjameslockhart@gmail.com"
  },
  "sentDate" : "2013-05-28T21:30:33Z",
  "timestamp" : "2013-06-14T00:24:37.030Z",
  "title" : "Start - Feedback",
  "url" : "http://startx.stanford.edu/feedback",
  "userId" : "51ba6272c5e6caeb16000009"
});


appInitUtils.initApp('indexLockTest', initActions, conf, function() {

  testLink.save (function (err) {
    if (err) {
      winston.doError (err);
    }
  });

  // acquire lock
  indexingHandler.acquireLockAfterTimeout (LinkModel, testLink._id, 0, function (err, lockedAttOrLink) {
    if (err) {
      winston.handleError (err)
    } else {
      winston.doInfo ('lock acquired', {model : lockedAttOrLink});
    }
  })

});