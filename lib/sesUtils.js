var aws = require('aws-lib'),
    conf = require ('../conf');

var sesUtils = this;

var sesClient = aws.createSESClient(conf.aws.key, conf.aws.secret);

exports.sendEmail = function (recipient, sender, text, html, subject, callback) {
  var sendArgs = {
    'Destination.ToAddresses.member.1': recipient,
    'Message.Body.Text.Charset': 'UTF-8',
    'Message.Body.Text.Data': text,
    'Message.Body.Html.Charset': 'UTF-8',
    'Message.Body.Html.Data': html,
    'Message.Subject.Charset': 'UTF-8',
    'Message.Subject.Data': subject,
    'Source': sender
  };

  sesClient.call('SendEmail', sendArgs, function(err, result) {
    if (err) {
      callback (winston.makeError (err));
    } else {
      callback ();
    }
  });

}


exports.sendInternalNotificationEmail = function (text, subject, callback) {
  sesUtils.sendEmail ('it@mikeyteam.com', 'noreply@mikeyteam.com', text, text, subject, callback);
}