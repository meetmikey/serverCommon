var serverCommon = process.env.SERVER_COMMON;

var sesUtils = require (serverCommon + '/lib/sesUtils')
  , appInitUtils = require(serverCommon + '/lib/appInitUtils')
  , winston = require (serverCommon + '/lib/winstonWrapper').winston


var initActions = [
  appInitUtils.CONNECT_MONGO
];

appInitUtils.initApp( 'sesTest', initActions, null, function() {

  var user = {
    "shortId" : "2",
    "googleID" : "110148452855623425596",
    "accessHash" : "20c1fe8eca0216f32c8a7b2ff36b1cfb26ddbb876e4a858456f80f2cb4c78581bc32eb52f39b1d040f299ee91eb318e4c39dac10a5b7de2f4b400a2574e67254",
    "displayName" : "Sagar Test",
    "firstName" : "Sagar",
    "lastName" : "Test",
    "email" : "mikeytesting1@gmail.com",
    "gender" : "male",
    "locale" : "en",
    "expiresAt" : "2013-08-01T19:40:57.655Z",
    "symHash" : "43285075a95933c6ee8e99655e36dcb4c4afba8efb58f17c38612e8bab8ad9e4e1cdb6eef2489c1484b9c152cdace274377c36cfa2800ff1e59ab58689c32b7c",
    "symSalt" : "28ee2f80d11d9bf9",
    "asymHash" : "$2a$08$hDUMcIngWunkI5ps8XbQ3OvU8OW1XKsecHVSKechraFAhnCEowxOG",
    "asymSalt" : "$2a$08$hDUMcIngWunkI5ps8XbQ3O",
    "_id" : "51faabb9cc3e5c192700000a",
    "lastResumeJobEndDate" : "2013-06-05T01:35:39Z",
    "billingPlan" : "free",
    "isPremium" : false,
    "daysLimit" : 90,
    "allMailOnboardAttempts" : 0,
    "minMailDate" : "2013-06-05T01:35:39Z",
    "minMRProcessedDate" : "2013-06-05T01:37:07Z",
    "minProcessedDate" : "2013-06-05T01:37:07Z",
    "timestamp" : "2013-08-01T18:40:57.686Z",
    "invalidToken" : false,
    "gmailScrapeRequested" : true,
    "__v" : 0
  }


  var link = {
    "__v" : 1,
    "_id" : "51faabdb35b8f20127000015",
    "comparableURLHash" : "ba4d5a6009f3e50b85b5beb33a8b514a8d8b59bbe6a136aaa196fbb83e3e7047",
    "gmMsgHex" : "1402e01bfdf87600",
    "gmMsgId" : "1441961241541637632",
    "gmThreadId" : "1441961241541637632",
    "index" : [
      {
        "indexState" : "done",
        "version" : "v3",
        "_id" : "51faac48f51caadf2700000f",
        "tries" : 1
      }
    ],
    "isDeleted" : false,
    "isFollowed" : true,
    "isPromoted" : true,
    "linkInfoId" : "51faabdb431003751b07686e",
    "mailCleanSubject" : "pow",
    "mailId" : "51faabbe99c9f90c2700001d",
    "recipients" : [
      {
        "name" : "sagar@magicnotebook.com",
        "email" : "sagar@magicnotebook.com"
      }
    ],
    "sender" : {
      "name" : "Sagar Test",
      "email" : "mikeytesting1@gmail.com"
    },
    "sentDate" : "2013-07-30T05:16:41Z",
    "summary" : "The founders of Personal Capital have one goal in mind: to build a better money management experience for consumers. That’s why we’re blending cutting edge technology with objective financial advice. We believe this is the best way to empower individuals and their money.\nWith our client-centric busi",
    "timestamp" : "2013-08-01T18:41:31.180Z",
    "title" : "objective wealth management",
    "url" : "https://www.personalcapital.com/company",
    "userId" : "51faabb9cc3e5c192700000a"
  }

  var att = {
    "__v" : 1,
    "_id" : "51faabe235b8f2012700001b",
    "contentType" : "application/pdf",
    "docType" : "pdf",
    "fileSize" : 3324577,
    "filename" : "directions-Sam.pdf",
    "gmMsgHex" : "13f45241e92bea24",
    "gmMsgId" : "1437864624076352036",
    "gmThreadId" : "1437864624076352036",
    "hash" : "98f50ae1b01b09482d526877c44c8132cdc1d087e05a03436202f8818f40ccff",
    "index" : [
      {
        "indexState" : "done",
        "version" : "v3",
        "_id" : "51faac54f51caadf27000010",
        "tries" : 1
      }
    ],
    "isDeleted" : false,
    "isImage" : false,
    "isPromoted" : true,
    "mailCleanSubject" : "duplicate file",
    "mailId" : "51faabbe99c9f90c27000018",
    "recipients" : [
      {
        "name" : "mikeytesting1@gmail.com",
        "email" : "mikeytesting1@gmail.com"
      }
    ],
    "sender" : {
      "name" : "Justin Durack",
      "email" : "justin@mikeyteam.com"
    },
    "sentDate" : "2013-06-15T00:02:42Z",
    "timestamp" : "2013-08-01T18:41:38.018Z",
    "userId" : "51faabb9cc3e5c192700000a"
  }



  sesUtils.sendLikeEmail (true, link, user, function (err) {
      if (err) {
        winston.handleError (err);
      }
    });

  sesUtils.sendLikeEmail (false, att, user, function (err) {
      if (err) {
        winston.handleError (err);
      }
    });
});