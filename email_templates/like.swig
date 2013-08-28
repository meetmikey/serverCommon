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
  <body bgcolor="#f5f5f5" topmargin="0" leftmargin="0" marginheight="0" marginwidth="0" style="-webkit-font-smoothing:antialiased;width:100% !important;background-color:#f5f5f5;background-image:none;background-repeat:repeat;background-position:top left;background-attachment:scroll;-webkit-text-size-adjust:none;">
    <!--////////////////////////////////////////////////////////////////////////////////////////////////////
      Preheader text will only appear in certain client inboxes but are an excellent way of engaging the user.
      /////////////////////////////////////////////////////////////////////////////////////////////////////-->
    <!-- <span style="display: none; color:#222; line-height: 0;">{{senderName}} likes {% if isLink %}{{title}}{% else %}{{filename}}{% endif %}</span> -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="font-family: Arial, sans-serif; color:#222;">
      <tr>
        <td bgcolor="#f5f5f5" width="3%"></td>
        <td bgcolor="#f5f5f5" width="94%">
          <!--Content wrapper-->
          <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" class="content_wrap">
            <tr>
              <td width="100%" height="20" bgcolor="#f5f5f5"></td>
            </tr>
            <tr>
              <td bgcolor="#f5f5f5">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="#f5f5f5" width="200" class="hide">
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td width="100%" height="10" bgcolor="#f5f5f5"></td>
            </tr>
            <tr>
              <td width="100%">

                <!--Header-->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" align="left" style="background:#f5f5f5;">
                  <tr>
                    <td width="3%"></td>
                    <td class="profile-box" width="8%">
                      <!-- AJL trying to sub in the avatar image. Still needs to properly connected in -->
                      {% if senderImage %}
                        <img style="width:100%; height:auto; overlow:hidden; border-radius:500px; -web-kit-border-radius:500px; -moz-border-kit-radius:500px;" class="profile-pic" src="{{senderImage}}"></img>
                      {% else %}
                        <img style="width:100%; height:auto; overlow:hidden; border-radius:500px; -web-kit-border-radius:500px; -moz-border-kit-radius:500px;" class="profile-pic" src="http://meetmikey.com/cdn/img/avatar.png"></img>
                      {% endif %}
                    </td>
                    <td width="2%"></td>
                    <td width="82%">
                      <!-- AJL Want this to say Andrew just liked Justin's link -->
                      <strong>{{senderName}}</strong> just liked <strong>{{originName}}'s {{resourceType}}. 
                      <!-- {% if isLink %}
                      <strong><a style="color:#2c75ab; text-decoration:none;" href="{{ url }}">{{title}}</a></strong>
                      {% else %}
                      <strong>{{filename}}</strong>
                      {% endif %} -->
                    </td>
                    <td width="3%"></td>
                  </tr>
                  <td colspan="5" height="14px">
                  </td>
                  <tr>
                  </tr>
                </table>
                
                <!--Link-->
                {% if isLink %}
                <table width="100%" cellpadding="0" cellspacing="0" border="0" align="left" style="background:#ffffff;">
                  <tr>
                    <td colspan="5" height="18px" width="100%"></td>
                  </tr>
                  
                  <tr>
                    <td  width="3%"></td>
                    <td width="6%" style="overlow:hidden; height:auto;">
                      <img style="height:auto; width:100%;" src="{{linkFavicon}}"></img>
                    </td>
                    <td  width="2%"></td>
                    <td width="86%" style="font-size:18px; line-height:28px; font-weight:bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      <a href="{{URL}}" style="color:#2c75ab; text-decoration:none;">{{title}}</a>
                    </td>
                    <td width="3%"></td>
                  </tr>

                  <tr>
                    <td colspan="5" height="10px" width="100%"></td>
                  </tr>
                  
                  <tr>
                    <td width="3%"></td>
                    <td colspan="3" width="94%" style="v-align:top; color: #44444; overflow:hidden; font-size: 14px;">
                        <!-- AJL Was trying to make it so that if there was no linkImage, just the summary would appear -->
                        {{% if has linkImage %}}
                        <table width="94%" cellpadding="0" cellspacing="0" border="0" align="left" style="background:#ffffff; margin-top:10px;">
                          <tr>
                            <td style="overlow:hidden;" width="15%">
                              <img style="height:auto; width:100%" src="{{linkImage}}"></img>
                            </td>
                            <td width="2%"></td>
                            <td width="77%" style="v-align:top; height: 80px; color: #44444; overflow:hidden; font-size: 14px;">
                              {{summary}}                          
                            </td>
                          </tr>
                        </table>
                        {{% else %}}
                          {{summary}}  
                        {% endif %}
                    </td>
                    <td width="3%"></td>
                  </tr>
                  
                  <tr>
                    <td colspan="5" height="18px" width="100%"></td>
                  </tr>
                </table>
                {% endif %}
                

                <!--Attachment-->
                {% if isAttachment %}
                <table width="100%" cellpadding="0" cellspacing="0" border="0" align="left" style="background:#ffffff;">
                  <tr>
                    <td colspan="5" height="18px" width="100%"></td>
                  </tr>
                  <tr>
                    <td  width="3%"></td>
                    <td width="9%">
                      <img style="width:100%; height:auto;" src="{{fileIcon}}"></img>
                    </td>
                    <td width="2%"></td>
                    <td width="77%">
                      <div style="max-width:80%; font-size:18px; line-height:22px; font-weight:bold; display:inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        <div style="text-decoration:none; display:inline-block;">{{filename}}</div>
                      </div>
                      <span style="color:#77777; font-size:13px; margin-left:6px;">{{fileSize}}</span>
                    </td>
                    <td width="3%"></td>
                  </tr>
                  <tr>
                    <td colspan="5" height="18px" width="100%"></td>
                  </tr>
                </table>
                {% endif %}


                <!--Image-->
                {% if isImage %}
                <table width="100%" cellpadding="0" cellspacing="0" border="0" align="left" style="background:#ffffff;">
                  <tr>
                    <td colspan="5" height="18px" width="100%"></td>
                  </tr>
                  <tr>
                    <td  width="3%"></td>
                    <td width="94%">
                      <img style="width:100%; height:auto;" class="profile-pic" src="{{attachmentImage}}"></img>
                    </td>
                    <td width="3%"></td>
                    <td>
                  </tr>
                  <tr>
                    <td colspan="3" height="10px" width="100%"></td>
                  </tr>
                  <tr>
                    <td  width="3%"></td>
                    <td>
                      <div style="max-width:80%; font-size:18px; line-height:22px; font-weight:bold; display:inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        <div style="display:inline-block; text-decoration:none;">{{filename}}</div>
                      </div>
                      <span style="color:#77777; font-size:13px; margin-left: 6px;">{{fileSize}}</span>
                    </td>
                    <td width="3%"></td>
                    <td>
                  </tr>
                  <tr>
                    <td colspan="3" height="18px" width="100%"></td>
                  </tr>
                </table>
                {% endif %}



                <!--Footer-->
                <table align="center"  width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: 'Open Sans',sans-serif;font-size: 10px;font-weight: bold;letter-spacing: 1px;line-height: 24px;text-transform: uppercase;">
                  <tr align="center"  height="14px">
                    <td>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <a href="{{referralLink}}" style="color:#222222; text-transform:uppercase; text-decoration: none;">Sent by Mikey for Gmail</a>
                    </td>
                  </tr>
                  <tr height="10px">
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
              <td bgcolor="#f5f5f5" width="3%"></td>

            </tr>
          </table>
          <!--end Content wrapper-->
          {% if mixpanelPixelURL %}
            <img src="{{mixpanelPixelURL}}"></img>
          {% endif %}
        </td>
        <td bgcolor="#f5f5f5" width="3%">
        </td>
      </tr>
    </table>
  </body>
</html>