var serverCommon = process.env.SERVER_COMMON;

var mongoose = require (serverCommon + '/lib/mongooseConnect').mongoose
  , winston = require (serverCommon + '/lib/winstonWrapper').winston
  , followLinkUtils = require ('../lib/followLinkUtils')

//var url = 'https://github.com/JomuMist/VacationRentals/commit/a5d0a77db82c5e5e3b9d3e94f7ebf3de95331af4'
//var url = 'http://mailstat.us/tr/t/p2yekqgmbo6rhhifw6i9/3/https://www.vizify.com/es/51633c8f42ba9b000e000412'
//var url = 'http://www.espn.go.com'
var url = 'http://www.nytimes.com/2013/05/19/magazine/why-basketball-wont-leave-phil-jackson-alone.html'
var linkInfo = {
  "_id" : "52092faf99b2908598d1c8b2",
  "comparableURL" : "github.com/ghinda/gmail-righttasks/issues/7",
  "comparableURLHash" : "41ccdbc79fbf843ca0c2145179c1a5eeea1ed3b52305ecf10fad27129a9e9420",
  "followJobCreated" : true,
  "followType" : "diffbot",
  "lastFollowDate" : "2013-08-12T18:56:16.954Z",
  "rawURL" : "https://github.com/ghinda/gmail-righttasks/issues/7",
  "summary" : "Could you please make Right Tasks compatible with the additional menu bar provided by Mikey for Gmail ?\nIn email view it is still fine because there the Mikey menu is not used:\nBut in index view Right Tasks does not make use of the full space available up to the settings button:",
  "title" : "gmail-righttasks"
}


followLinkUtils.followDiffbotLink ({},  linkInfo, function (a, b, c, d) {
  console.log (a)
  console.log (b)
  console.log (c)
  console.log (d)
})