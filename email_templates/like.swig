<!DOCTYPE html>

<html lang="en">
<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type">
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no, width=device-width, target-densitydpi=device-dpi" />
    <style type="text/css">
        @viewport{
        width: device-width;
        }
        @-ms-viewport{
        width: device-width;
        }
        table td, table tr { border-collapse: collapse; }
        @import url(http://fonts.googleapis.com/css?family=Open+Sans+Condensed:700);
        .main-table {margin-left: 10px; margin-right: 10px;}
        .text-email {
            -moz-text-size-adjust: none; 
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
        }
    </style>
</head>


  <body>
        <table width="100%" align="center" border="0" bg cellpadding="0" cellspacing="0" bgcolor="#f7f7f7;" style="background-color:#f7f7f7;">
            <tbody>
                <tr>
                 
                    <td width="540px" align="center" style="width=540px; margin-left:auto; margin-right:auto;">

                        <table width="540px" id="main-table" style="margin-left:10px; margin-right: 10px;">
                            <tr>
                                <td width="540px" HEIGHT="18PX"><div></div></td>
                            </tr>
                        </table>

                            <!-- HEADER -->
                        <table border="0" bg cellpadding="0" cellspacing="0" width="540px">
                            <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="18PX">
                                    <div></div>
                                </td>
                                <td width="20px"><div></div></td>
                            </tr>
                            <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px">
                                    <table border="0" bg cellpadding="0" cellspacing="0" width="500px">
                                        <tr>
                                            <td width="30px" style="vertical-align:top;">
                                                <img src="{{senderImage}}" width="30px" style="overlow:hidden; border-radius:500px; -web-kit-border-radius:500px; -moz-border-kit-radius:500px;">
                                                
                                            </td>
                                            <td width="15px">
                                                <div></div>
                                            </td>
                                            <td width ="455px" style="color: #444444; font-family: 'Helvetica Neue', Arial, Helvetica, Geneva, sans-serif; margin-top:0px; font-size: 18px; line-height: 20px;">
                                                <div class="text-email">
                                                    <strong>{{senderName}}</strong> just liked <strong>
                                                  {% if originalSenderName %}
                                                    {{originalSenderName}}'s
                                                  {% else %}
                                                    a{% if resourceTypeBeginsWithAVowel %}n{% endif %}
                                                  {% endif %} {{resourceType}}.  
                                                    </strong>
                                                </div>
                                            </td>
                                        </tr>

                                    </table>
                                </td>
                                <td width="20px" HEIGHT="18PX"><div></div></td>
                            </tr>
                            <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="18PX">
                                    <div></div>
                                </td>
                                <td width="20px"><div></div></td>
                            </tr>

                        </table>


                        <!-- FILE -->



                        {% if isAttachment %}

                        <table border="0" bg cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #efefef" width="540px">
                            <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="18PX">
                                </td>
                                <td width="20px"><div></div></td>
                            </tr>
                            <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="18PX">
                                    <table border="0" bg cellpadding="0" cellspacing="0" width="500px">
                                        <tr>
                                            <td width="30px" style="vertical-align:top;">
                                                <img style="width:30px; height:30px;" src="{{fileIcon}}">
                                            </td>
                                            <td width="15px">
                                                <div></div>
                                            </td>
                                            <td width ="455px" style="color: #777777; font-family: 'Helvetica Neue', Arial, Helvetica, Geneva, sans-serif; margin-top:0px; font-size: 18px; line-height: 20px;">
                                                <div class="text-email" style="width: 455px; ">
                                                    <strong>{{filename}}</strong>&nbsp;&nbsp;<span style="font-size:12px; background-color: #222222;">{{filenameSize}}</span> 
                                                </div>
                                            </td>
                                        </tr>

                                    </table>
                                </td>
                                <td width="20px"><div></div></td>
                                <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="18PX"><div></div>
                                </td>
                                <td width="20px"><div></div></td>
                            </tr>
                        </table>
                        {% endif %}


                        <!-- LINK -->
                        {% if isLink %}
                        {% if linkImage %}
                        <table border="0" bg cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #efefef; -webkit-border-radius: 3px;
                        border-radius: 3px;" width="540px">
                            <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="18PX">
                                    <div></div>
                                </td>
                                <td width="20px"><div></div></td>
                            </tr>
                            <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px">
                                      <table width="500px" border="0" bg cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td width="16px">
                                                <img style="height:auto; width:16px; vertical-align: middle;" src="{{linkFavicon}}"></img>
                                            </td>
                                            <td width="15px">
                                                <div></div>
                                            </td>
                                            <td width="469px" HEIGHT="18PX">
                                                <div class="text-email">
                                                   <a href="{{linkURL}}" style="text-decoration: none; color: #777777; font-size: 18px; line-height:20px; width: 469px; overflow: hidden;"> 
                                                    <strong><span style="text-decoration: none; color: #777777; font-size: 18px; line-height:20px; ">{{linkTitle}}</span></strong>  
                                                    </a>
                                                </div> 
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td width="20px"><div></div></td>
                            </tr>
                            <tr>
                                
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="12PX">
                                    <div></div>
                                </td>
                                <td width="20px"><div></div></td>
                            <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="18PX">
                                    <table border="0" bg cellpadding="0" cellspacing="0" width="500px">
                                        <tr>
                                            <td width="100px" style="vertical-align:top;">
                                                <img style="height:auto; width:100px; border: 1px solid #f7f7f7;" src="{{linkImage}}">
                                            </td>
                                            <td width="20px">
                                                <div></div>
                                            </td>
                                            <td width="380px" style="vertical-align:top;">                      
                                                <table border="0" bg cellpadding="0" cellspacing="0">
                                                   
                                                    <tr>
                                                        
                                                        <td width="380" style="color:#444444; font-size: 12px; line-height: 16px; font-family: 'Helvetica Neue', Arial, Helvetica, Geneva, sans-serif; vertical-align:top;">
                                                            <div class="text-email">{{summary}}</div>  
                                                        </td>
                                                        
                                                    </tr>
                                                </table>    
                                            </td>
                                        </tr>

                                    </table>
                                </td>
                                <td width="20px"><div></div></td>
                                <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="18PX">
                                </td>
                                <td width="20px"><div></div></td>
                            </tr>
                        </table>
                        {% else %}
                        <table border="0" bg cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #efefef; -webkit-border-radius: 3px;
                        border-radius: 3px;" width="540px">
                            <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="18PX">
                                    <div></div>
                                </td>
                                <td width="20px"><div></div></td>
                            </tr>
                            <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="18PX">
                                    <table border="0" bg cellpadding="0" cellspacing="0">
                                        <tr>
                                             <td width="500px">
                                                  <table width="500px" border="0" bg cellpadding="0" cellspacing="0">
                                                    <tr>
                                                    <td width="16px">
                                                        <img style="height:auto; width:16px; vertical-align: middle;" src="{{linkFavicon}}"></img>
                                                    </td>
                                                    <td width="15px">
                                                        <div></div>
                                                    </td>
                                                    <td width="469px" HEIGHT="18PX">
                                                        <div class="text-email">
                                                           <a href="{{linkURL}}" style="text-decoration: none; color: #777777; font-size: 18px; line-height:20px;"> 
                                                            <strong><span style="text-decoration: none; color: #777777; font-size: 18px; line-height:20px; width: 469px; overflow: hidden;">{{linkTitle}}</span></strong>  
                                                            </a>
                                                        </div> 
                                                    </td>
                                                    </tr>
                                                </table>
                                             </td>
                                        </tr>
                                        <tr>
                                            <td width="500px" height="10px">
                                            </td>
                                        </tr>
                                        <tr>
                                            <td width="500px" style="color:#444444; font-size: 13px; line-height: 16px; font-family: 'Helvetica Neue', Arial, Helvetica, Geneva, sans-serif; vertical-align:top;">
                                                <div class="text-email">{{summary}}</div>  
                                            </td>
                                        </tr>
                                    </table>    
                                </td>
                                <td width="20px"><div></div></td>
                                <tr>
                                <td width="20px"><div></div></td>
                                <td width="500px" HEIGHT="18PX">
                                    <div></div>
                                </td>
                                <td width="20px"><div></div></td>
                            </tr>
                        </table>

                        {% endif %}
                        {% endif %}

                        <!-- IMAGE -->

                        {% if isImage %}
                            <table width="540px">
                                <tr>
                                <td width="540px" align="center">
                                <table border="0" bg cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #efefef; -webkit-border-radius: 3px;
                                border-radius: 3px;" width="290px">
                                    <tr>
                                        <td width="20px"><div></div></td>
                                        <td width="250px" HEIGHT="18PX">
                                            <div></div>
                                        </td>
                                        <td width="20px"><div></div></td>
                                    </tr>
                                    <tr>
                                        <td width="20px"><div></div></td>
                                        <td width="250px">
                                            <table border="0" bg cellpadding="0" cellspacing="0" width="250px">
                                                <tr>
                                                    <td width="250px">
                                                        <img style="width:250px; height:auto; border: 1px solid #f7f7f7; margin-left: auto; margin-right: auto;" src="{{attachmentImage}}">
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td width="250px" height="10px">
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td width ="250px" style="color: #777777; font-family: 'Helvetica Neue', Arial, Helvetica, Geneva, sans-serif; margin-top:0px; font-size: 18px; line-height: 20px;">
                                                    <div class="text-email" style="width: 250px; overflow: hidden;">
                                                        <strong>{{filename}}</strong>&nbsp;&nbsp;<span style="font-size:12px; color: #222222;">{{fileSize}}</span> 
                                                    </div>
                                                </td>
                                                </tr>
                                            </table>
                                        </td>
                                        <td width="20px"><div></div></td>
                                        <tr>
                                        <td width="20px"><div></div></td>
                                        <td width="250px" HEIGHT="18PX">
                                            <div></div>
                                        </td>
                                        <td width="20px"><div></div></td>
                                    </tr>
                                </table>
                                </td>
                                </tr>
                            </table>
                        {% endif %}

                        <!-- FOOTER -->
                        <table border="0" bg cellpadding="0" cellspacing="0" style="background-color:#f7f7f7;" width="540px">
                            <tr>
                                <td width="500px" HEIGHT="18PX">
                                    <div></div>
                                </td>
                            <tr>
                                <td width="500px" style="text-align:center;">
                                    <div class="text-email">
                                        <a href="{{referralLink}}" style="color:#444444; text-transform:uppercase; text-decoration: none; font-family: 'Open Sans',sans-serif; font-weight: bold; font-size:11px; letter-spacing: 1px;line-height: 24px;text-transform: uppercase; ">Sent by Mikey for Gmail</a>
                                    </div>
                                    <br>
                                    {% if mixpanelPixelURL %}
                                        <img src="{{mixpanelPixelURL}}">
                                    {% endif %}
                                </td>
                            </tr>
                            <tr>
                                <td width="500px" height="60px">
                                    <div></div>
                                </td>
                            <tr>
                        </table>
                    </td>
               
                </tr>
            </tbody>
        </table>
    </body>
</html>
