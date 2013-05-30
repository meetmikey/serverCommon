var cloudStorageUtils = require('../lib/cloudStorageUtils');
  , mongoose = require ('../lib/mongooseConnect').mongoose
  , winston = require('../lib/winstonWrapper').winston

var newFileName = 'yoyo';

var AttachmentModel = mongoose.model ('Attachment')

var attachment = new AttachmentModel({
  "__v" : 0,
  "_id" : "5139ae724b95c9b92c000044",
  "contentType" : "image/jpeg",
  "docType" : "image",
  "fileSize" : 160192,
  "filename" : newFileName,
  "gmMsgHex" : "13d47b1122d49165",
  "gmMsgId" : "1428902295312306533",
  "gmThreadId" : "1428902295312306533",
  "hash" : "949ce038ff2797c92ac5c03dd7f109a2081e0f9cbf9379f02a46caa274c9c9b8",
  "indexState" : "done",
  "isImage" : true,
  "isPromoted" : true,
  "mailBodyHTML" : "<div dir=\"ltr\"><br><br><div class=\"gmail_quote\">---------- Forwarded message ----------<br>From: <b class=\"gmail_sendername\">Andrew Lockhart</b> <span dir=\"ltr\">&lt;<a href=\"mailto:andrewjameslockhart@gmail.com\">andrewjameslockhart@gmail.com</a>&gt;</span><br>\n\nDate: Fri, Feb 22, 2013 at 10:41 AM<br>Subject: images<br>To: &quot;<a href=\"mailto:alock@stanford.edu\">alock@stanford.edu</a>&quot; &lt;<a href=\"mailto:alock@stanford.edu\">alock@stanford.edu</a>&gt;<br><br><br><div dir=\"ltr\">\n\n<br></div>\n</div><br></div>\n",
  "mailBodyText" : "---------- Forwarded message ----------\nFrom: Andrew Lockhart <andrewjameslockhart@gmail.com>\nDate: Fri, Feb 22, 2013 at 10:41 AM\nSubject: images\nTo: \"alock@stanford.edu\" <alock@stanford.edu>\n",
  "mailCleanSubject" : "images",
  "mailId" : "5139ae35a0a7e2992c000127",
  "recipients" : [
    {
      "name" : "Sagar Mehta",
      "email" : "sagar@mikeyteam.com",
      "_id" : "5139ae35a0a7e2992c000128"
    }
  ],
  "sender" : {
    "name" : "Andrew Lockhart",
    "email" : "alock@stanford.edu"
  },
  "sentDate" : "2013-03-08T01:50:20Z",
  "timestamp" : "2013-03-08T09:25:06.950Z",
  "userId" : "5139ae31dcb335912c000005"
})


//  'response-content-disposition' : 'inline;' + newFileName

var url = cloudStorageUtils.signedURL (cloudStorageUtils.getAttachmentPath (attachment), 30, attachment);
winston.doInfo('url', {url: url});