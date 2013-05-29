var winston = require('../lib/winstonWrapper').winston
  , appInitUtils = require('../lib/appInitUtils')
  , memcached = require ('../lib/memcachedConnect')
  , conf = require('../conf')

var initActions = [
  appInitUtils.CONNECT_MEMCACHED
];

appInitUtils.initApp( 'memcache connect', initActions, conf, function() {

  winston.doInfo('memcache connection success');

  var links = [{
    "__v" : 0,
    "_id" : "5146c0dd37fc1b62060000f3",
    "comparableURLHash" : "ebe70694034797a2e7f1c159adb729371fc816e92d7ced61d0270a9694440273",
    "gmMsgHex" : "13d04552c31a3971",
    "gmMsgId" : "1427717303639357809",
    "gmThreadId" : "1427714534825131243",
    "indexState" : "done",
    "isFollowed" : false,
    "isPromoted" : true,
    "linkInfoId" : "5146bc254e03984f34a8daed",
    "mailCleanSubject" : "Thank you",
    "mailId" : "5146beedcaa56d9f52042f08",
    "recipients" : [
      {
        "name" : "'Andrew Lockhart'",
        "email" : "andrewjameslockhart@gmail.com"
      }
    ],
    "sender" : {
      "name" : "Martin Sinner",
      "email" : "martin@idealo.de"
    },
    "sentDate" : "2013-02-22T23:55:23Z",
    "shardKey" : "f7bee",
    "timestamp" : "2013-03-18T07:23:09.230Z",
    "url" : "http://martin-idealo.de",
    "userId" : "514266e16a9290970a000008"
  },
  {
    "__v" : 0,
    "_id" : "5179a72db07e4ee83400066d",
    "comparableURLHash" : "48d00b372ac7acda13e6cc7ef1d95ad3e80724eed35a13e06fce0ebafafa89f1",
    "gmMsgHex" : "13e3fac38465f22b",
    "gmMsgId" : "1433264824080790059",
    "gmThreadId" : "1433264824080790059",
    "index" : [ ],
    "isFollowed" : false,
    "isPromoted" : true,
    "linkInfoId" : "515016b34e03984f34a9f756",
    "mailCleanSubject" : "GSPB events",
    "mailId" : "5179a3b0f57aa1193300031d",
    "recipients" : [
      {
        "name" : "gspb-members@lists.stanford.edu",
        "email" : "gspb-members@lists.stanford.edu"
      }
    ],
    "sender" : {
      "name" : "Karen Marie Powroznik",
      "email" : "powroznk@stanford.edu"
    },
    "sentDate" : "2013-04-25T05:30:51Z",
    "timestamp" : "2013-04-25T21:59:09.714Z",
    "url" : "http://www.stanford.edu/groups/gspb",
    "userId" : "5160af87c33a1f391c000006"
  },
  {
    "__v" : 0,
    "_id" : "517d85517b5633b3a8000edf",
    "comparableURLHash" : "3f7d4e752054393485311c7392c05cd125c1d1062a35bcf0088fc5c0dc59b365",
    "gmMsgHex" : "12c1d547a83278cd",
    "gmMsgId" : "1351595866929133773",
    "gmThreadId" : "1351595866929133773",
    "index" : [ ],
    "isFollowed" : false,
    "isPromoted" : true,
    "linkInfoId" : "517d85424e03984f34b67e5e",
    "mailCleanSubject" : "Playall Site Usability",
    "mailId" : "516c52b613c0d1669f00efad",
    "recipients" : [
      {
        "name" : "martin@idealo.de",
        "email" : "martin@idealo.de"
      },
      {
        "name" : "christophex@gmail.com",
        "email" : "christophex@gmail.com"
      }
    ],
    "sender" : {
      "name" : "Thomas Lambeck",
      "email" : "thomas.lambeck@playall.com"
    },
    "sentDate" : "2010-11-05T18:37:44Z",
    "timestamp" : "2013-04-28T20:23:45.763Z",
    "url" : "http://PLAYALL.INFO",
    "userId" : "516c48fae02a65774700000a"
  },
  {
    "__v" : 0,
    "_id" : "517d85517b5633b3a8000ee8",
    "comparableURLHash" : "6095950058480875e8dbb2896d90dec0a551306c44b77fe6e00089b9a2918238",
    "gmMsgHex" : "12c1d547a83278cd",
    "gmMsgId" : "1351595866929133773",
    "gmThreadId" : "1351595866929133773",
    "index" : [ ],
    "isFollowed" : false,
    "isPromoted" : true,
    "linkInfoId" : "517d85424e03984f34b67e56",
    "mailCleanSubject" : "Playall Site Usability",
    "mailId" : "516c52b613c0d1669f00efad",
    "recipients" : [
      {
        "name" : "martin@idealo.de",
        "email" : "martin@idealo.de"
      },
      {
        "name" : "christophex@gmail.com",
        "email" : "christophex@gmail.com"
      }
    ],
    "sender" : {
      "name" : "Thomas Lambeck",
      "email" : "thomas.lambeck@playall.com"
    },
    "sentDate" : "2010-11-05T18:37:44Z",
    "timestamp" : "2013-04-28T20:23:45.790Z",
    "url" : "http://PLAYALL.TV",
    "userId" : "516c48fae02a65774700000a"
  },
  {
    "__v" : 0,
    "_id" : "517d85517b5633b3a8000ee0",
    "comparableURLHash" : "bd147298596f06a88170c6a2741a59f7a94be56d8c088ddeb808528b8dcb92e7",
    "gmMsgHex" : "12c1d547a83278cd",
    "gmMsgId" : "1351595866929133773",
    "gmThreadId" : "1351595866929133773",
    "index" : [ ],
    "isFollowed" : false,
    "isPromoted" : true,
    "linkInfoId" : "517d85424e03984f34b67e5a",
    "mailCleanSubject" : "Playall Site Usability",
    "mailId" : "516c52b613c0d1669f00efad",
    "recipients" : [
      {
        "name" : "martin@idealo.de",
        "email" : "martin@idealo.de"
      },
      {
        "name" : "christophex@gmail.com",
        "email" : "christophex@gmail.com"
      }
    ],
    "sender" : {
      "name" : "Thomas Lambeck",
      "email" : "thomas.lambeck@playall.com"
    },
    "sentDate" : "2010-11-05T18:37:44Z",
    "timestamp" : "2013-04-28T20:23:45.764Z",
    "url" : "http://PLAY-ALL.ORG",
    "userId" : "516c48fae02a65774700000a"
  },
  {
    "__v" : 0,
    "_id" : "517d85517b5633b3a8000ed6",
    "comparableURLHash" : "58af78fe093e2007925589c6490dd2d820ea37bdcbaf171c2153f9cb537d6f0a",
    "gmMsgHex" : "12c1d547a83278cd",
    "gmMsgId" : "1351595866929133773",
    "gmThreadId" : "1351595866929133773",
    "index" : [ ],
    "isFollowed" : false,
    "isPromoted" : true,
    "linkInfoId" : "517d85424e03984f34b67e4f",
    "mailCleanSubject" : "Playall Site Usability",
    "mailId" : "516c52b613c0d1669f00efad",
    "recipients" : [
      {
        "name" : "martin@idealo.de",
        "email" : "martin@idealo.de"
      },
      {
        "name" : "christophex@gmail.com",
        "email" : "christophex@gmail.com"
      }
    ],
    "sender" : {
      "name" : "Thomas Lambeck",
      "email" : "thomas.lambeck@playall.com"
    },
    "sentDate" : "2010-11-05T18:37:44Z",
    "timestamp" : "2013-04-28T20:23:45.748Z",
    "url" : "http://PLAY-ALL.NET",
    "userId" : "516c48fae02a65774700000a"
  }];


  memcached.setBatch (links, 
    function (err, result) {
      memcached.get ('517d85517b5633b3a8000ed6', function (err, result) {
        winston.doInfo('GET ONE', {result: result});
      });

      memcached.get (['517d85517b5633b3a8000ed6','517d85517b5633b3a8000ee0'], function (err, result) {
        winston.doInfo('GET BOTH', {result: result});
      });

      memcached.get (['517d85517b5633b3a8000ed6','517d85517b5633b3a8d00ee0'], function (err, result) {
        winston.doInfo('GET 1 correct', {result: result});
      });
    });
});