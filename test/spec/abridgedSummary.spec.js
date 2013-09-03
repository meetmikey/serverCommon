var serverCommon = process.env.SERVER_COMMON;

var emailTemplates = require (serverCommon + '/lib/emailTemplates');

describe ('abridgedSummary', function () {

  it ('long', function () {
    var summary = "Mr. Obama and Vice President Joseph R. Biden Jr. summoned Mr. Boehner and other Republican and Democratic leaders to the White House as they intensified their push for Congressional approval of an attack on Syria. Conservative House Republicans have expressed deep reluctance about the president’s strategy, and winning Mr. Boehner’s approval could help the president make inroads with a group that has not supported him on most issues in the past. Representative Nancy Pelosi, the House Democratic leader, said, “I believe the American people need to hear more about the intelligence. Ms. Pelosi said she did believe that Congressional authorization was a good thing, although not necessary, and that she was hopeful the American people “will be persuaded of” military action."
    var abridgedSummary = "Mr. Obama and Vice President Joseph R. Biden Jr. summoned Mr. Boehner and other Republican and Democratic leaders to the White House as they intensified their push for Congressional approval of an attack on Syria. Conservative House Republicans have expressed deep reluctance about the president’s strategy, and winning Mr...."
    expect( emailTemplates.getAbridgedSummary( summary ) ).toBe( abridgedSummary );
  });


  it ('short', function () {
    var summary = "too short to change"
    expect( emailTemplates.getAbridgedSummary( summary ) ).toBe( summary + "..." );
  });

  it ('null', function () {
    var summary;
    expect( emailTemplates.getAbridgedSummary( summary ) ).toBe( "" );
  });


});