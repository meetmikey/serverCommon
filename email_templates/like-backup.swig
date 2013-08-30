<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Responsive email template</title>
    <style>
      body {
      width:100%!important;
      -webkit-text-size-adjust:100%;
      -ms-text-size-adjust:100%;
      margin:0;
      padding:0;
      }
      .ExternalClass {
      width: 100%;
      }
    
      @media only screen and (max-width: 600px) {
      table[class="content_wrap"] {
      width: 94%!important;
      }
      table[class="full_width"] {
      width: 100%!important;
      }
      table[class="hide"], img[class="hide"], td[class="hide"] {
      display: none !important;
      }
      td[class="text-center"] {
      text-align: center!important;
      }
      a[class="button"] {
      border-radius:2px;
      -moz-border-radius:2px;
      -webkitborder-radius:2px;
      background-color:#308F9B;
      color:#fff!important;
      padding: 5px;
      display:block;
      text-decoration: none;
      text-transform: uppercase;
      margin: 0 0 10px 0;
      }
      }
      @import url(http://fonts.googleapis.com/css?family=Open+Sans+Condensed:700);
    </style>
  </head>
  <body bgcolor="#E5E5E5" topmargin="0" leftmargin="0" marginheight="0" marginwidth="0" style="-webkit-font-smoothing:antialiased;width:100% !important;background-color:#e5e5e5;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;-webkit-text-size-adjust:none;">
    <!--////////////////////////////////////////////////////////////////////////////////////////////////////
      Preheader text will only appear in certain client inboxes but are an excellent way of engaging the user.
      /////////////////////////////////////////////////////////////////////////////////////////////////////-->
    <!-- <span style="display: none; color:#222; line-height: 0;">{{senderName}} likes {% if isLink %}{{title}}{% else %}{{filename}}{% endif %}</span> -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="font-family: Arial, sans-serif; color:#222;">
      <tr>
        <td bgcolor="#e5e5e5" width="3%"></td>
        <td bgcolor="#e5e5e5" width="94%">
          <!--Content wrapper-->
          <table width="560px" cellpadding="0" cellspacing="0" border="0" align="center" class="content_wrap">
            <tr>
              <td width="560px" height="20"></td>
            </tr>
            <tr>
              <td>
                <table width="560px" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="560px" class="hide">
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td width="560px" height="10" ></td>
            </tr>
            <tr>
              <td width="560px">

                <!--Header-->
                <table width="560px" cellpadding="0" cellspacing="0" border="0" align="left" style="background:#e5e5e5;">
                  <tr>
                    <td width="20px"></td>
                    <td class="profile-box" width="60px">
                      <img style="width:60px; height:auto; overlow:hidden; border-radius:500px; -web-kit-border-radius:500px; -moz-border-kit-radius:500px;" class="profile-pic" src="{{senderImage}}"></img>
                    </td>
                    <td width="20px"></td>
                    <td width="440px" style="font-size:8px; line-height: 20px;">
                      <strong>{{senderName}}</strong> just liked <strong>
                      {% if originalSenderName %}
                        {{originalSenderName}}'s
                      {% else %}
                        a{% if resourceTypeBeginsWithAVowel %}n{% endif %}
                      {% endif %} {{resourceType}}.
                    </td>
                    <td width="20px"></td>
                  </tr>
                  <td colspan="5" height="14px">
                  </td>
                  <tr>
                  </tr>
                </table>
                
                <!--Link-->
                {% if isLink %}
                <table width="560px" cellpadding="0" cellspacing="0" border="0" align="left" style="background:#ffffff;">
                  <tr>
                    <td colspan="5" height="14px" width="100%"></td>
                  </tr>
                  
                  <tr width="560px;">
                    <td  width="20px"></td>
                    <td width="20px" style="overlow:hidden; height:auto;">
                      <img style="height:auto; width:100%;" src="{{linkFavicon}}"></img>
                    </td>
                    <td  width="20px"></td>
                    <td width="480px" style="font-size:16px; line-height:20px; font-weight:bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      <a href="{{URL}}" style="color:#2c75ab; text-decoration:none;">{{title}}</a>
                    </td>
                    <td width="20px"></td>
                  </tr>

                  <tr>
                    <td colspan="5" height="10px" width="100px"></td>
                  </tr>
                  
                  <tr>
                    <td width="20px"></td>
                    <td colspan="3" width="560px" style="v-align:top; color: #44444; overflow:hidden; font-size: 14px;">
                        <table width="560px" cellpadding="0" cellspacing="0" border="0" align="left" style="background:#ffffff; margin-top:20px;">
                          <tr>
                            {% if linkImage %}
                            <td style="overlow:hidden;" width="100px">
                              <img style="height:auto; width:100%; border: 1px solid #f7f7f7;" src="{{linkImage}}"></img>
                            </td>
                            <td width="20px"></td>
                            {% endif %}
                            <td width="400px" style="v-align:top; color: #44444; font-size: 14px;">
                              {{summary}}                          
                            </td>
                          </tr>
                        </table>
                    </td>
                    <td width="20px"></td>
                  </tr>
                  
                  <tr>
                    <td colspan="5" height="14px" width="560px"></td>
                  </tr>
                </table>
                {% endif %}
                

                <!--Attachment-->
                {% if isAttachment %}
                <table width="560px" cellpadding="0" cellspacing="0" border="0" align="left" style="background:#ffffff;">
                  <tr>
                    <td colspan="5" height="14px" width="560px"></td>
                  </tr>
                  <tr>
                    <td  width="20px"></td>
                    <td width="60px">
                      <img style="width:100%; height:auto;" src="{{fileIcon}}"></img>
                    </td>
                    <td width="20px"></td>
                    <td width="440px" style="font-size:16px; line-height:20px; display:inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          <strong>{{filename}}</strong>&nbsp;&nbsp;{{fileSize}}
                    </td>
                    <td width="20px"></td>
                  </tr>
                  <tr>
                    <td colspan="5" height="14px" width="560px"></td>
                  </tr>
                </table>
                {% endif %}


                <!--Image-->
                {% if isImage %}
                <table width="560px" cellpadding="0" cellspacing="0" border="0" align="left" style="background:#ffffff;">
                  <tr>
                    <td colspan="5" height="14px" width="560px"></td>
                  </tr>
                  <tr>
                    <td  width="20px"></td>
                    <td width="560px">
                      <img style="width:100%; height:auto; border: 1px solid #f7f7f7;" class="profile-pic" src="{{attachmentImage}}"></img>
                    </td>
                    <td width="20px"></td>
                    <td>
                  </tr>
                  <tr>
                    <td colspan="3" height="20px" width="100%"></td>
                  </tr>
                  <tr>
                    <td  width="20px"></td>
                    <td width="560px">
                      <div style="display:inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        <div style="display:inline-block; color:#222; text-decoration:none; font-size:16px; line-height:20px;">
                          <strong>{{filename}}</strong>&nbsp;&nbsp;{{fileSize}}
                        </div>
                      </div>
                     
                    </td>
                    <td width="20px"></td>
                    <td>
                  </tr>
                  <tr>
                    <td colspan="3" height="14px" width="560px"></td>
                  </tr>
                </table>
                {% endif %}



                <!--Footer-->
                <table align="center" bgcolor="#e5e5e5"  width="560px" cellpadding="0" cellspacing="0" border="0" style="font-family: 'Open Sans',sans-serif;font-size: 10px;font-weight: bold;letter-spacing: 1px;line-height: 24px;text-transform: uppercase;">
                  <tr align="center"  height="14px">
                    <td>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <a href="{{referralLink}}" style="color:#222222; text-transform:uppercase; text-decoration: none;">Sent by Mikey for Gmail</a>
                    </td>
                  </tr>
                  <tr height="20px">
                    <td>
                    </td>
                  </tr>
                </table>
                <table>
                  <tr>
                    <td height="40px">
                    </td>
                  </tr>
                </table>

              </td>
              <td width="3%"></td>

            </tr>
          </table>
          <!--end Content wrapper-->
          {% if mixpanelPixelURL %}
            <img src="{{mixpanelPixelURL}}"></img>
          {% endif %}
        </td>
        <td bgcolor="#e5e5e5" width="3%">
        </td>
      </tr>
    </table>
  </body>
</html>


====================


<!DOCTYPE html>

<html>
<head>
    <title></title>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type">
    <meta content="width=320, target-densitydpi=device-dpi" name="viewport">
    <style type="text/css">
/* Mobile-specific Styles */
    @media only screen and (max-width: 660px) { 
    table[class=w0], td[class=w0] { width: 0 !important; }
    table[class=w10], td[class=w10], img[class=w10] { width:10px !important; }
    table[class=w15], td[class=w15], img[class=w15] { width:5px !important; }
    table[class=w30], td[class=w30], img[class=w30] { width:10px !important; }
    table[class=w60], td[class=w60], img[class=w60] { width:10px !important; }
    table[class=w125], td[class=w125], img[class=w125] { width:80px !important; }
    table[class=w130], td[class=w130], img[class=w130] { width:55px !important; }
    table[class=w140], td[class=w140], img[class=w140] { width:90px !important; }
    table[class=w160], td[class=w160], img[class=w160] { width:180px !important; }
    table[class=w170], td[class=w170], img[class=w170] { width:100px !important; }
    table[class=w180], td[class=w180], img[class=w180] { width:80px !important; }
    table[class=w195], td[class=w195], img[class=w195] { width:80px !important; }
    table[class=w220], td[class=w220], img[class=w220] { width:80px !important; }
    table[class=w240], td[class=w240], img[class=w240] { width:180px !important; }
    table[class=w255], td[class=w255], img[class=w255] { width:185px !important; }
    table[class=w275], td[class=w275], img[class=w275] { width:135px !important; }
    table[class=w280], td[class=w280], img[class=w280] { width:135px !important; }
    table[class=w300], td[class=w300], img[class=w300] { width:140px !important; }
    table[class=w325], td[class=w325], img[class=w325] { width:95px !important; }
    table[class=w360], td[class=w360], img[class=w360] { width:140px !important; }
    table[class=w410], td[class=w410], img[class=w410] { width:180px !important; }
    table[class=w470], td[class=w470], img[class=w470] { width:200px !important; }
    table[class=w580], td[class=w580], img[class=w580] { width:280px !important; }
    table[class=w640], td[class=w640], img[class=w640] { width:300px !important; }
    table[class*=hide], td[class*=hide], img[class*=hide], p[class*=hide], span[class*=hide] { display:none !important; }
    table[class=h0], td[class=h0] { height: 0 !important; }
    p[class=footer-content-left] { text-align: center !important; }
    #headline p { font-size: 30px !important; }
    .article-content, #left-sidebar{ -webkit-text-size-adjust: 90% !important; -ms-text-size-adjust: 90% !important; }
    .header-content, .footer-content-left {-webkit-text-size-adjust: 80% !important; -ms-text-size-adjust: 80% !important;}
    img { height: auto; line-height: 100%;}
    } 
    /* Client-specific Styles */
    #outlook a { padding: 0; }    /* Force Outlook to provide a "view in browser" button. */
    body { width: 100% !important; }
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; display:block !important; } /* Force Hotmail to display emails at full width */
    /* Reset Styles */
    /* Add 100px so mobile switch bar doesn't cover street address. */
    body { background-color: #dedede; margin: 0; padding: 0; }
    img { outline: none; text-decoration: none; display: block;}
    br, strong br, b br, em br, i br { line-height:100%; }
    h1, h2, h3, h4, h5, h6 { line-height: 100% !important; -webkit-font-smoothing: antialiased; }
    h1 a, h2 a, h3 a, h4 a, h5 a, h6 a { color: blue !important; }
    h1 a:active, h2 a:active,  h3 a:active, h4 a:active, h5 a:active, h6 a:active { color: red !important; }
    /* Preferably not the same color as the normal header link color.  There is limited support for psuedo classes in email clients, this was added just for good measure. */
    h1 a:visited, h2 a:visited,  h3 a:visited, h4 a:visited, h5 a:visited, h6 a:visited { color: purple !important; }
    /* Preferably not the same color as the normal header link color. There is limited support for psuedo classes in email clients, this was added just for good measure. */  
    table td, table tr { border-collapse: collapse; }
    .yshortcuts, .yshortcuts a, .yshortcuts a:link,.yshortcuts a:visited, .yshortcuts a:hover, .yshortcuts a span {
    color: black; text-decoration: none !important; border-bottom: none !important; background: none !important;
    }   /* Body text color for the New Yahoo.  This example sets the font of Yahoo's Shortcuts to black. */
    /* This most probably won't work in all email clients. Don't include code blocks in email. */
    code {
    white-space: normal;
    word-break: break-all;
    }
    #background-table { background-color: #dedede; }
    /* Webkit Elements */
    #top-bar { border-radius:6px 6px 0px 0px; -moz-border-radius: 6px 6px 0px 0px; -webkit-border-radius:6px 6px 0px 0px; -webkit-font-smoothing: antialiased; background-color: #c7c7c7; color: #ededed; }
    #top-bar a { font-weight: bold; color: #ffffff; text-decoration: none;}
    #footer { border-radius:0px 0px 6px 6px; -moz-border-radius: 0px 0px 6px 6px; -webkit-border-radius:0px 0px 6px 6px; -webkit-font-smoothing: antialiased; }
    /* Fonts and Content */
    body, td { font-family: 'Helvetica Neue', Arial, Helvetica, Geneva, sans-serif; }
    .header-content, .footer-content-left, .footer-content-right { -webkit-text-size-adjust: none; -ms-text-size-adjust: none; }
    /* Prevent Webkit and Windows Mobile platforms from changing default font sizes on header and footer. */
    .header-content { font-size: 12px; color: #ededed; }
    .header-content a { font-weight: bold; color: #ffffff; text-decoration: none; }
    #headline p { color: #444444; font-family: 'Helvetica Neue', Arial, Helvetica, Geneva, sans-serif; font-size: 36px; text-align: center; margin-top:0px; margin-bottom:30px; }
    #headline p a { color: #444444; text-decoration: none; }
    .article-title { font-size: 18px; line-height:24px; color: #888888; font-weight:bold; margin-top:0px; margin-bottom:18px; font-family: 'Helvetica Neue', Arial, Helvetica, Geneva, sans-serif; }
    .article-title a { color: #888888; text-decoration: none; }
    .article-title.with-meta {margin-bottom: 0;}
    .article-meta { font-size: 13px; line-height: 20px; color: #ccc; font-weight: bold; margin-top: 0;}
    .article-content { font-size: 13px; line-height: 18px; color: #444444; margin-top: 0px; margin-bottom: 18px; font-family: 'Helvetica Neue', Arial, Helvetica, Geneva, sans-serif; }
    .article-content a { color: #2c75ab; font-weight:bold; text-decoration:none; }
    .article-content img { max-width: 100% }
    .article-content ol, .article-content ul { margin-top:0px; margin-bottom:18px; margin-left:19px; padding:0; }
    .article-content li { font-size: 13px; line-height: 18px; color: #444444; }
    .article-content li a { color: #2c75ab; text-decoration:underline; }
    .article-content p {margin-bottom: 15px;}
    .footer-content-left { font-size: 12px; line-height: 15px; color: #ededed; margin-top: 0px; margin-bottom: 15px; }
    .footer-content-left a { color: #ffffff; font-weight: bold; text-decoration: none; }
    .footer-content-right { font-size: 11px; line-height: 16px; color: #ededed; margin-top: 0px; margin-bottom: 15px; }
    .footer-content-right a { color: #ffffff; font-weight: bold; text-decoration: none; }
    #footer { background-color: #c7c7c7; color: #ededed; }
    #footer a { color: #ffffff; text-decoration: none; font-weight: bold; }
    #permission-reminder { white-space: normal; }
    #street-address { color: #b0b0b0; white-space: normal; }
    </style><!--[if gte mso 9]>
<style _tmplitem="157" >
.article-content ol, .article-content ul {
   margin: 0 0 0 24px;
   padding: 0;
   list-style-position: inside;
}
</style>
<![endif]-->
</head>

<body>
    <table border="0" cellpadding="0" cellspacing="0" id="background-table"
    width="100%">
        <tbody>
            <tr>
                <td align="center" style="background-color: #DEDEDE">
                    <table border="0" cellpadding="0" cellspacing="0" class=
                    "w640" style="margin:0 10px;" width="640">
                        <tbody>
                            <tr>
                                <td class="w640" height="20" width="640"></td>
                            </tr>

                            <tr>
                                <td class="w640" width="640">
                                    
                                </td>
                            </tr>

                            <tr>
                                <td align="center" class="w640" id="header"
                                style="background-color: #FFFFFF" width="640">
                                    <table border="0" cellpadding="0"
                                    cellspacing="0" class="w640" width="640">
                                        <tbody>
                                            <tr>
                                                <td class="w30" width="30">
                                                </td>

                                                <td class="w580" height="30"
                                                width="580"></td>

                                                <td class="w30" width="30">
                                                </td>
                                            </tr>

                                            <tr>
                                                <td class="w30" width="30">
                                                </td>

                                                <td class="w580" width="580">
                                                    <div id="headline" style=
                                                    "text-align: center">
                                                        <p>
                                                          <strong>{{senderName}}</strong> just liked <strong>
                                                          {% if originalSenderName %}
                                                            {{originalSenderName}}'s
                                                          {% else %}
                                                            a{% if resourceTypeBeginsWithAVowel %}n{% endif %}
                                                          {% endif %} {{resourceType}}.
                                                        </p>
                                                    </div>
                                                </td>

                                                <td class="w30" width="30">
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td class="w640" height="30" style=
                                "background-color: #FFFFFF" width="640"></td>
                            </tr>

                            <tr id="simple-content-row">
                                <td class="w640" style=
                                "background-color: #FFFFFF" width="640">
                                    <table border="0" cellpadding="0"
                                    cellspacing="0" class="w640" width="640">
                                        <tbody>
                                            <tr>
                                                <td class="w30" width="30">
                                                </td>

                                                <td class="w580" width="580">
                                                    <table border="0"
                                                    cellpadding="0"
                                                    cellspacing="0" class=
                                                    "w580" width="580">
                                                        <tbody>
                                                            <tr>
                                                                <td class=
                                                                "w580" width=
                                                                "580">
                                                                    <p class=
                                                                    "article-title"
                                                                    style=
                                                                    "text-align: left">
                                                                    Filename.pdf</p>
                                                                </td>
                                                            </tr>

                                                            <tr>
                                                                <td class=
                                                                "w580" height=
                                                                "10" width=
                                                                "580"></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    <table border="0"
                                                    cellpadding="0"
                                                    cellspacing="0" class=
                                                    "w580" width="580">
                                                        <tbody>
                                                            <tr>
                                                                <td class=
                                                                "w580" width=
                                                                "580">
                                                                    <p class=
                                                                    "article-title"
                                                                    style=
                                                                    "text-align: left">
                                                                    Add a
                                                                    title</p>
                                                                </td>
                                                            </tr>

                                                            <tr>
                                                                <td class=
                                                                "w580" width=
                                                                "580">
                                                                <img border="0"
                                                                class="w580"
                                                                width=
                                                                "580"></td>
                                                            </tr>

                                                            <tr>
                                                                <td class=
                                                                "w580" height=
                                                                "15" width=
                                                                "580"></td>
                                                            </tr>

                                                            <tr>
                                                                <td class=
                                                                "w580" width=
                                                                "580">
                                                                    <div class="article-content" style="text-align: left">
                                                                    Free-agent forward Lamar Odom is in a Los Angeles hotel, where friends are trying to get him help for an unspecified drug problem, a source told ESPN on Monday.

                                                                    The information comes after Odom's agent refuted a TMZ report Sunday that his client had been missing for 72 hours after a dispute with his wife, Khloe Kardashian.

                                                                    Agent Jeff Schwartz would not reveal Odom's whereabouts, telling ESPN.com's Marc Stein earlier Monday: "Lamar is not missing. His wife knows exactly where he is."
                                                                    </div>
                                                                </td>
                                                            </tr>

                                                            <tr>
                                                                <td class=
                                                                "w580" height=
                                                                "10" width=
                                                                "580"></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    <table border="0"
                                                    cellpadding="0"
                                                    cellspacing="0" class=
                                                    "w580" width="580">
                                                        <tbody>
                                                            <tr>
                                                                <td class=
                                                                "w580" width=
                                                                "580">
                                                                    <p class=
                                                                    "article-title"
                                                                    style=
                                                                    "text-align: left">
                                                                    Add a
                                                                    title</p>

                                                                    <table align="right"
                                                                    border="0"
                                                                    cellpadding="0"
                                                                    cellspacing="0">
                                                                    <tbody>
                                                                            <tr>
                                                                            <td class="w30"
                                                                                width="15">
                                                                                </td>

                                                                                <td>
                                                                                <img border="0"
                                                                                class="w300"
                                                                                width="300"></td>
                                                                            </tr>

                                                                            <tr>
                                                                            <td class="w30"
                                                                                height="5"
                                                                                width="15">
                                                                                </td>

                                                                                <td>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>

                                                                    <div class=
                                                                    "article-content"
                                                                    style=
                                                                    "text-align: left">
                                                                    Free-agent forward Lamar Odom is in a Los Angeles hotel, where friends are trying to get him help for an unspecified drug problem, a source told ESPN on Monday. The information comes after Odom's agent refuted a TMZ report Sunday that his client had been missing for 72 hours after a dispute with his wife, Khloe Kardashian. Agent Jeff Schwartz would not reveal Odom's whereabouts, telling ESPN.com's Marc Stein earlier Monday: "Lamar is not missing. His wife knows exactly where he is."
                                                                    description
                                                                    </div>
                                                                </td>
                                                            </tr>

                                                            <tr>
                                                                <td class=
                                                                "w580" height=
                                                                "10" width=
                                                                "580"></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    <table border="0"
                                                    cellpadding="0"
                                                    cellspacing="0" class=
                                                    "w580" width="580">
                                                        <tbody>
                                                            <tr>
                                                                <td class=
                                                                "w580" width=
                                                                "580">
                                                                    <p class=
                                                                    "article-title"
                                                                    style=
                                                                    "text-align: left">
                                                                    Add a
                                                                    title</p>

                                                                    <table align="left"
                                                                    border="0"
                                                                    cellpadding="0"
                                                                    cellspacing="0">
                                                                    <tbody>
                                                                            <tr>
                                                                            <td>
                                                                                <img border="0"
                                                                                class="w300"
                                                                                width="300"></td>

                                                                                <td class="w30"
                                                                                width="15">
                                                                                </td>
                                                                            </tr>

                                                                            <tr>
                                                                            <td>
                                                                                </td>

                                                                                <td class="w30"
                                                                                height="5"
                                                                                width="15">
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>

                                                                    <div class=
                                                                    "article-content"
                                                                    style=
                                                                    "text-align: left">
                                                                    Free-agent forward Lamar Odom is in a Los Angeles hotel, where friends are trying to get him help for an unspecified drug problem, a source told ESPN on Monday. The information comes after Odom's agent refuted a TMZ report Sunday that his client had been missing for 72 hours after a dispute with his wife, Khloe Kardashian. Agent Jeff Schwartz would not reveal Odom's whereabouts, telling ESPN.com's Marc Stein earlier Monday: "Lamar is not missing. His wife knows exactly where he is."
                                                                    description
                                                                    </div>
                                                                </td>
                                                            </tr>

                                                            <tr>
                                                                <td class=
                                                                "w580" height=
                                                                "10" width=
                                                                "580"></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    <table border="0"
                                                    cellpadding="0"
                                                    cellspacing="0" class=
                                                    "w580" width="580">
                                                        <tbody>
                                                            <tr>
                                                                <td class=
                                                                "w275" valign=
                                                                "top" width=
                                                                "275">
                                                                    <table border="0"
                                                                    cellpadding="0"
                                                                    cellspacing="0"
                                                                    class=
                                                                    "w275"
                                                                    width=
                                                                    "275">
                                                                        <tbody>
                                                                            <tr>
                                                                            <td class="w275"
                                                                                width="275">
                                                                                <p class="article-title"
                                                                                    style="text-align: left">
                                                                                    Add
                                                                                    a
                                                                                    title</p>

                                                                                    <div class="article-content"
                                                                                    style="text-align: left">
                                                                                    Free-agent forward Lamar Odom is in a Los Angeles hotel, where friends are trying to get him help for an unspecified drug problem, a source told ESPN on Monday. The information comes after Odom's agent refuted a TMZ report Sunday that his client had been missing for 72 hours after a dispute with his wife, Khloe Kardashian. Agent Jeff Schwartz would not reveal Odom's whereabouts, telling ESPN.com's Marc Stein earlier Monday: "Lamar is not missing. His wife knows exactly where he is."
                                                                                    your
                                                                                    description
                                                                                    </div>
                                                                                </td>
                                                                            </tr>

                                                                            <tr>
                                                                            <td class="w275"
                                                                                height="10"
                                                                                width="275">
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>

                                                                <td class="w30"
                                                                width="30">
                                                                </td>

                                                                <td class=
                                                                "w275" valign=
                                                                "top" width=
                                                                "275">
                                                                    <table border="0"
                                                                    cellpadding="0"
                                                                    cellspacing="0"
                                                                    class=
                                                                    "w275"
                                                                    width=
                                                                    "275">
                                                                        <tbody>
                                                                            <tr>
                                                                            <td class="w275"
                                                                                width="275">
                                                                                <p class="article-title"
                                                                                    style="text-align: left">
                                                                                    Add
                                                                                    a
                                                                                    title</p>

                                                                                    <div class="article-content"
                                                                                    style="text-align: left">
                                                                                    Free-agent forward Lamar Odom is in a Los Angeles hotel, where friends are trying to get him help for an unspecified drug problem, a source told ESPN on Monday. The information comes after Odom's agent refuted a TMZ report Sunday that his client had been missing for 72 hours after a dispute with his wife, Khloe Kardashian. Agent Jeff Schwartz would not reveal Odom's whereabouts, telling ESPN.com's Marc Stein earlier Monday: "Lamar is not missing. His wife knows exactly where he is."
                                                                                    your
                                                                                    description
                                                                                    </div>
                                                                                </td>
                                                                            </tr>

                                                                            <tr>
                                                                            <td class="w275"
                                                                                height="10"
                                                                                width="275">
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    
                                                    <table border="0"
                                                    cellpadding="0"
                                                    cellspacing="0" class=
                                                    "w580" width="580">
                                                        <tbody>
                                                            <tr>
                                                                <td class=
                                                                "w580" width=
                                                                "580">
                                                                    <p class=
                                                                    "article-title"
                                                                    style=
                                                                    "text-align: left">
                                                                    Filename.pdf</p>
                                                                </td>
                                                            </tr>

                                                            <tr>
                                                                <td class=
                                                                "w580" height=
                                                                "10" width=
                                                                "580"></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    <table border="0"
                                                    cellpadding="0"
                                                    cellspacing="0" class=
                                                    "w580" width="580">
                                                        <tbody>

                                                            <tr>
                                                                <td class=
                                                                "w180" valign=
                                                                "top" width=
                                                                "180">
                                                                    <table border="0"
                                                                    cellpadding="0"
                                                                    cellspacing="0"
                                                                    class=
                                                                    "w180"
                                                                    width=
                                                                    "180">
                                                                        <tbody>
                                                                            <tr>
                                                                            <td class="w180"
                                                                                width="180">
                                                                                <img border="0"
                                                                                class="w180"
                                                                                width="180"></td>
                                                                            </tr>

                                                                            <tr>
                                                                            <td class="w180"
                                                                                height="10"
                                                                                width="180">
                                                                                </td>
                                                                            </tr>

                                                                            <tr>
                                                                            <td class="w180"
                                                                                width="180">
                                                                                <div class="article-content"
                                                                                    style="text-align: left">
                                                                                    Free-agent forward Lamar Odom is in a Los Angeles hotel, where friends are trying to get him help for an unspecified drug problem, a source told ESPN on Monday. The information comes after Odom's agent refuted a TMZ report Sunday that his client had been missing for 72 hours after a dispute with his wife, Khloe Kardashian. Agent Jeff Schwartz would not reveal Odom's whereabouts, telling ESPN.com's Marc Stein earlier Monday: "Lamar is not missing. His wife knows exactly where he is."
                                                                                    your
                                                                                    description
                                                                                    </div>
                                                                                </td>
                                                                            </tr>

                                                                            <tr>
                                                                            <td class="w180"
                                                                                height="10"
                                                                                width="180">
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>

                                                                <td width="20">
                                                                </td>

                                                                <td class=
                                                                "w360" valign=
                                                                "top" width=
                                                                "360">
                                                                    <table border="0"
                                                                    cellpadding="0"
                                                                    cellspacing="0"
                                                                    class=
                                                                    "w360"
                                                                    width=
                                                                    "360">
                                                                        <tbody>
                                                                            <tr>
                                                                            <td class="w360"
                                                                                width="360">
                                                                                <img border="0"
                                                                                class="w360"
                                                                                width="360"></td>
                                                                            </tr>

                                                                            <tr>
                                                                            <td class="w360"
                                                                                height="10"
                                                                                width="360">
                                                                                </td>
                                                                            </tr>

                                                                            <tr>
                                                                            <td class="w360"
                                                                                width="360">
                                                                                <div class="article-content"
                                                                                    style="text-align: left">
                                                                                    Free-agent forward Lamar Odom is in a Los Angeles hotel, where friends are trying to get him help for an unspecified drug problem, a source told ESPN on Monday. The information comes after Odom's agent refuted a TMZ report Sunday that his client had been missing for 72 hours after a dispute with his wife, Khloe Kardashian. Agent Jeff Schwartz would not reveal Odom's whereabouts, telling ESPN.com's Marc Stein earlier Monday: "Lamar is not missing. His wife knows exactly where he is."
                                                                                    your
                                                                                    description
                                                                                    </div>
                                                                                </td>
                                                                            </tr>

                                                                            <tr>
                                                                            <td class="w360"
                                                                                height="10"
                                                                                width="360">
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>

                                                <td class="w30" width="30">
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td class="w640" height="15" style=
                                "background-color: #FFFFFF" width="640"></td>
                            </tr>

                            <tr>
                                <td class="w640" width="640"></td>
                            </tr>

                            <tr>
                                <td class="w640" height="60" width="640"></td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>

