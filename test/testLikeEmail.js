var smtpUtils = require ('../lib/smtpUtils');
var emailTemplates = require ('../lib/emailTemplates');

var linkModel = {
  __v: 1,
  _id: "52048bdb74ed335b08006cb6",
  comparableURLHash: "7d90cab63906dfb782fc21431165267a218574184a645cd0ea88cea3a79a060e",
  gmMsgHex: "14060f7ef9765509",
  gmMsgId: "1442857768644400393",
  gmThreadId: "1442857768644400393",
  image: "images/0fd9d779134baccfd37ab9624c5b8da26c0c576188b5fb72715792e6428eaafd",
  imageThumbExists: true,
  isFollowed: true,
  isPromoted: true,
  linkInfoId: "52048bc925d817e3aeaeaa64",
  mailCleanSubject: "coolest!",
  mailId: "52048be9ed7605bea8011375",
  summary: "Space Exploration Technologies Corporation (SpaceX) is a space-transportation startup company founded by Elon Musk. It is developing the partially reusable launch vehicles Falcon 1 and Falcon 9. Originally based in El Segundo, SpaceX now operates out of Hawthorne, California, USA. SpaceX was founded",
  title: "Space Exploration Technologies",
  url: "http://www.crunchbase.com/company/space-exploration-technologies",
  userId: "51c8e009986bebf622001158",
  isLiked: false,
  isFavorite: false,
  isDeleted: false,
  timestamp: "2013-08-09T06:27:39.491Z",
  index: [
  {
    indexState: "done",
    version: "v3",
    _id: "52048bdf3f4e1cc53f00020f",
    tries: 1
  }
  ],
  recipients: [
    {
      name: "Sagar Test",
      email: "mikeytesting1@gmail.com"
    },
    {
      name: "Andrew Lockhart",
      email: "andrewjameslockhart@gmail.com"
    }
  ],
  sender: {
      name: "Andrew Lockhart",
      email: "andrewjameslockhart@gmail.com"
  },
  sentDate: "2013-08-09T02:46:36.000Z"
}


var attachmentModel = {
  image: "",
  __v: 1,
  _id: "51c8e026ec2015eeb8002a1b",
  contentType: "chemical/x-xyz",
  docType: "other",
  fileSize: 18,
  filename: "xyz",
  gmMsgHex: "13f129839f143c95",
  gmMsgId: "1436975401394257045",
  gmThreadId: "1436975401394257045",
  hash: "f459d2d0acb0516baaa8d8b824ad0ffe6188a84b28153a3383bcb6c6b985e803",
  isImage: false,
  isPromoted: true,
  mailCleanSubject: "test4",
  mailId: "51c8e04303162168d501d349",
  userId: "51c8e009986bebf622001158",
  isLiked: false,
  isFavorite: false,
  timestamp: "2013-06-25T00:11:18.666Z",
  isDeleted: false,
  index: [
  {
  indexState: "done",
  version: "v3",
  _id: "51c8e0344ab5c4be99000248",
  tries: 1
  }
  ],
  recipients: [
    {
      name: "Sagar Test",
      email: "mikeytesting1@gmail.com"
    },
    {
      name: "Andrew Lockhart",
      email: "andrewjameslockhart@gmail.com"
    }
  ],
  sender: {
      name: "Andrew Lockhart",
      email: "andrewjameslockhart@gmail.com"
  },
  sentDate: "2013-06-05T04:28:53.000Z"
}

var imageModel = {
  __v: 1,
  _id: "52048bdb74ed335b08006ca2",
  attachmentThumbExists: true,
  contentType: "image/png",
  docType: "image",
  fileSize: 73505,
  filename: "Screenshot from 2013-07-25 14:16:16.png",
  gmMsgHex: "14060f7ef9765509",
  gmMsgId: "1442857768644400393",
  gmThreadId: "1442857768644400393",
  hash: "11a40ad51c23b2c7a4869fd25f7c22aa16a93030ba9dc36633776e976536c419",
  isImage: true,
  isPromoted: true,
  mailCleanSubject: "coolest!",
  mailId: "52048be9ed7605bea8011375",
  userId: "51c8e009986bebf622001158",
  isLiked: false,
  isFavorite: false,
  timestamp: "2013-08-09T06:27:39.317Z",
  isDeleted: false,
  index: [
    {
      asStub: true,
      indexState: "done",
      version: "v3",
      _id: "52048bca3f4e1cc53f00020b",
      tries: 1
    }
  ],
  recipients: [
    {
      name: "Sagar Test",
      email: "mikeytesting1@gmail.com"
    },
    {
      name: "Andrew Lockhart",
      email: "andrewjameslockhart@gmail.com"
    }

    
  ],
  sender: {
      name: "Andrew Lockhart",
      email: "andrewjameslockhart@gmail.com"
  },
  sentDate: "2013-08-09T02:46:36.000Z"
}


var user = { __v: 0,
  _id: '521d38054e078def1a00000a',
  accessHash: 'e2a17e8762d08708e24bc8c0b2ad5885c5cfa3a0f222f583bb3ba2447a55f7b7e14505e86978ab787910440b3a44d02f6720a9b6e5a79556ef2c4a3ba6b47dec',
  asymHash: '$2a$08$eM4wfW6xWFUeVEDMpHhp.uUkv2WWUlYpCjJRm3emjQaXd7nqj0pmi',
  asymSalt: '$2a$08$eM4wfW6xWFUeVEDMpHhp.u',
  accessToken: 'ya29.AHES6ZRT6DvOfA0THxKIdAKsoo5F9MuQSqyqkcQMM8ibgncetQu8seg',
  refreshToken: '1/MT8NXPxkuD2Wo-n7Ua2EXOdreD14cnfxSOGPY0LlJoY',
  displayName: 'Sagar Test',
  email: 'mikeytesting1@gmail.com',
  firstName: 'Sagar',
  gender: 'male',
  googleID: '110148452855623425596',
  lastName: 'Test',
  locale: 'en',
  shortId: '1',
  symHash: '848c57916c05cbe5d6ef8674acdc4a90c03b217130b30769cb580152b7dcfbf0b1515e520c516540295d3d40f43711ee8d67da5bf92c72fe9ded88e495cc9756',
  symSalt: '1669048e18dd0328',
  billingPlan: 'free',
  isPremium: false,
  daysLimit: 90,
  allMailOnboardAttempts: 0,
  invalidToken: false,
  gmailScrapeRequested: true }


var sendTo = ['andrewjameslockhart@gmail.com'];

emailTemplates.getLikeEmail( user, linkModel, 'link', false, function (err, emailText, emailHTML, attachments) {
  if (err) {
    console.log (err);
  } else {
    smtpUtils.sendEmail (user, 'messageId', sendTo, 'mikeytesting1@gmail.com', emailText, emailHTML, 'RE: coolest!', attachments, function (err) {
      if (err) {
        console.log (err)
      } else {
        console.log ('success link!')
      }
    });
  }
});


emailTemplates.getLikeEmail( user, imageModel, 'image', false, function (err, emailText, emailHTML, attachments) {
  if (err) {
    console.log (err);
  } else {
    smtpUtils.sendEmail (user, 'messageId', sendTo, 'mikeytesting1@gmail.com', emailText, emailHTML, 'RE: coolest!', attachments, function (err) {
      if (err) {
        console.log (err)
      } else {
        console.log ('success image!')
      }
    });
  }
});


emailTemplates.getLikeEmail( user, attachmentModel, 'attachment', false, function (err, emailText, emailHTML, attachments) {
  if (err) {
    console.log (err);
  } else {
    smtpUtils.sendEmail (user, 'messageId', sendTo, 'mikeytesting1@gmail.com', emailText, emailHTML, 'RE: coolest!', attachments, function (err) {
      if (err) {
        console.log (err)
      } else {
        console.log ('success attachment!')
      }
    });
  }
});
