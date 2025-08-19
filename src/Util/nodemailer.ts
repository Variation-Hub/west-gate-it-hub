const nodemailer = require('nodemailer');

// export const transporter = nodemailer.createTransport({
//     host: "live.smtp.mailtrap.io",
//     port: 587,
//     auth: {
//         user: "api",
//         pass: "b8c3571b2e58a51a9ddfc53c768cf1ae"
//     }
// });

export const transporter = nodemailer.createTransport({
    host: "live.smtp.mailtrap.io",
    port: 587,
    auth: {
        user: "api",
        pass: "8c23ab8a1cf2690c31ed4ce3feeb5df6"
    }
});

export const fromMail = "ayush@westgateithub.in"

export async function emailHelper(reciverEmail: string, password: string) {
    try {

        const template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta content="telephone=no" name="format-detection"><title>New Template</title> <!--[if (mso 16)]><style type="text/css">     a {text-decoration: none;}     </style><![endif]--> <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> <!--[if gte mso 9]><xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml>
        <![endif]--> <!--[if mso]><style type="text/css">      ul {   margin: 0 !important;   }   ol {   margin: 0 !important;   }   li {   margin-left: 47px !important;   }  </style>
        <![endif] --><style type="text/css">.rollover:hover .rollover-first { max-height:0px!important; display:none!important; } .rollover:hover .rollover-second { max-height:none!important; display:block!important; } .rollover span { font-size:0px; } u + .body img ~ div div { display:none; } #outlook a { padding:0; } span.MsoHyperlink,span.MsoHyperlinkFollowed { color:inherit; mso-style-priority:99; } a.es-button { mso-style-priority:100!important; text-decoration:none!important; } a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important; } .es-desk-hidden { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all; } .es-button-border:hover > a.es-button { color:#ffffff!important; }
        @media only screen and (max-width:600px) {.es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } *[class="gmail-fix"] { display:none!important } p, a { line-height:150%!important } h1, h1 a { line-height:120%!important } h2, h2 a { line-height:120%!important } h3, h3 a { line-height:120%!important } h4, h4 a { line-height:120%!important } h5, h5 a { line-height:120%!important } h6, h6 a { line-height:120%!important } h1 { font-size:36px!important; text-align:left } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } h4 { font-size:24px!important; text-align:left } h5 { font-size:20px!important; text-align:left } h6 { font-size:16px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:36px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:26px!important }
         .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-header-body h4 a, .es-content-body h4 a, .es-footer-body h4 a { font-size:24px!important } .es-header-body h5 a, .es-content-body h5 a, .es-footer-body h5 a { font-size:20px!important } .es-header-body h6 a, .es-content-body h6 a, .es-footer-body h6 a { font-size:16px!important } .es-menu td a { font-size:12px!important } .es-header-body p, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body a { font-size:14px!important } .es-footer-body p, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock a { font-size:12px!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3, .es-m-txt-c h4, .es-m-txt-c h5, .es-m-txt-c h6 { text-align:center!important }
         .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3, .es-m-txt-r h4, .es-m-txt-r h5, .es-m-txt-r h6 { text-align:right!important } .es-m-txt-j, .es-m-txt-j h1, .es-m-txt-j h2, .es-m-txt-j h3, .es-m-txt-j h4, .es-m-txt-j h5, .es-m-txt-j h6 { text-align:justify!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3, .es-m-txt-l h4, .es-m-txt-l h5, .es-m-txt-l h6 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-m-txt-r .rollover:hover .rollover-second, .es-m-txt-c .rollover:hover .rollover-second, .es-m-txt-l .rollover:hover .rollover-second { display:inline!important } .es-m-txt-r .rollover span, .es-m-txt-c .rollover span, .es-m-txt-l .rollover span { line-height:0!important; font-size:0!important } .es-spacer { display:inline-table } a.es-button, button.es-button { font-size:20px!important; line-height:120%!important }
         a.es-button, button.es-button, .es-button-border { display:inline-block!important } .es-m-fw, .es-m-fw.es-fw, .es-m-fw .es-button { display:block!important } .es-m-il, .es-m-il .es-button, .es-social, .es-social td, .es-menu { display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important }
         table.es-table-not-adapt, .esd-block-html table { width:auto!important } .es-social td { padding-bottom:10px } .h-auto { height:auto!important } }@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }</style>
         </head> <body class="body" style="width:100%;height:100%;padding:0;Margin:0"><div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FAFAFA"> <!--[if gte mso 9]> <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#fafafa"></v:fill> </v:background><![endif]--><table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA"><tr><td valign="top" style="padding:0;Margin:0"><table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important"><tr>
        <td class="es-info-area" align="center" style="padding:0;Margin:0"><table class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" bgcolor="#FFFFFF" role="none"><tr><td align="left" style="padding:20px;Margin:0"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" valign="top" style="padding:0;Margin:0;width:560px"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" style="padding:0;Margin:0;display:none"></td> </tr></table></td></tr></table></td></tr></table></td></tr></table>
         <table cellpadding="0" cellspacing="0" class="es-header" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top"><tr><td align="center" style="padding:0;Margin:0"><table bgcolor="#ffffff" class="es-header-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"><tr><td align="left" style="padding:20px;Margin:0"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr>
        <td class="es-m-p0r" valign="top" align="center" style="padding:0;Margin:0;width:560px"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" style="padding:0;Margin:0;padding-bottom:10px;font-size:0px"><img src="https://eihicsk.stripocdn.email/content/guids/CABINET_887f48b6a2f22ad4fb67bc2a58c0956b/images/93351617889024778.png" alt="Logo" style="display:block;font-size:12px;border:0;outline:none;text-decoration:none" width="200" title="Logo" height="48"></td> </tr></table></td></tr></table></td></tr></table></td></tr></table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important"><tr>
        <td align="center" style="padding:0;Margin:0"><table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"><tr><td align="left" style="padding:0;Margin:0;padding-top:15px;padding-right:20px;padding-left:20px"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" valign="top" style="padding:0;Margin:0;width:560px"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr>
        <td align="center" style="padding:0;Margin:0;padding-bottom:10px;padding-top:10px;font-size:0px"><img src="https://eihicsk.stripocdn.email/content/guids/CABINET_91d375bbb7ce4a7f7b848a611a0368a7/images/69901618385469411.png" alt="" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none" width="100" height="100"></td> </tr><tr><td align="center" class="es-m-p0r es-m-p0l es-m-txt-c" style="Margin:0;padding-top:15px;padding-right:40px;padding-bottom:15px;padding-left:40px"><h2 style="Margin:0;font-family:arial, 'helvetica neue', helvetica, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:26px;font-style:normal;font-weight:bold;line-height:31px;color:#333333">Password reset&nbsp;</h2></td></tr><tr>
        <td align="left" style="padding:0;Margin:0"><h3 align="center" style="Margin:0;font-family:arial, 'helvetica neue', helvetica, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:20px;font-style:normal;font-weight:bold;line-height:24px;color:#333333"><strong>Your Password is</strong> <em>${password}</em></h3></td></tr> <tr><td align="left" style="padding:0;Margin:0;padding-top:10px"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">To update your password, please follow these steps:</p><ol style="font-family:arial, 'helvetica neue', helvetica, sans-serif;padding:0px 0px 0px 40px;margin:15px 0px"> <li style="color:#333333;margin:0px 0px 15px;font-size:14px">Log in using your email ID and above password.</li> 
        <li style="color:#333333;margin:0px 0px 15px;font-size:14px">Navigate to your profile settings.</li> <li style="color:#333333;margin:0px 0px 15px;font-size:14px">Select the option to change your password.</li> <li style="color:#333333;margin:0px 0px 15px;font-size:14px">Enter your new password in the provided field.</li> <li style="color:#333333;margin:0px 0px 15px;font-size:14px">Click 'Submit' to save your changes.</li> </ol><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Remember to use a strong and unique password to enhance the security of your account.</p></td></tr><tr>
        <td align="center" style="padding:20px;Margin:0;font-size:0"><table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0" class="es-spacer" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:none;height:1px;width:100%;margin:0px"></td></tr></table></td></tr></table></td></tr></table></td></tr> <tr><td align="left" style="padding:0;Margin:0;padding-right:20px;padding-left:20px;padding-bottom:20px"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr>
        <td align="center" valign="top" style="padding:0;Margin:0;width:560px"><table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:5px" role="none"><tr><td align="center" style="padding:0;Margin:0;display:none"></td></tr></table></td></tr></table></td></tr></table></td></tr></table> <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top"><tr>
        <td align="center" style="padding:0;Margin:0"><table class="es-footer-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" role="none"><tr><td align="left" style="Margin:0;padding-right:20px;padding-left:20px;padding-bottom:20px;padding-top:20px"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="left" style="padding:0;Margin:0;width:560px"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr>
        <td align="center" style="padding:0;Margin:0;padding-top:15px;padding-bottom:15px;font-size:0"><table cellpadding="0" cellspacing="0" class="es-table-not-adapt es-social" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" valign="top" class="es-m-p0r" style="padding:0;Margin:0;padding-right:40px"><img title="Facebook" src="https://eihicsk.stripocdn.email/content/assets/img/social-icons/logo-black/facebook-logo-black.png" alt="Fb" width="32" height="32" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none"></td>
         <td align="center" valign="top" class="es-m-p0r" style="padding:0;Margin:0;padding-right:40px"><img title="X.com" src="https://eihicsk.stripocdn.email/content/assets/img/social-icons/logo-black/x-logo-black.png" alt="X" width="32" height="32" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none"></td><td align="center" valign="top" style="padding:0;Margin:0"><img title="Instagram" src="https://eihicsk.stripocdn.email/content/assets/img/social-icons/logo-black/instagram-logo-black.png" alt="Inst" width="32" height="32" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none"></td></tr></table></td></tr> <tr>
        <td align="center" style="padding:0;Margin:0;padding-bottom:35px"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;letter-spacing:0;color:#333333;font-size:12px">Style Casual&nbsp;© 2021 Style Casual, Inc. All Rights Reserved.</p></td></tr><tr><td align="center" style="padding:0;Margin:0;padding-bottom:10px;padding-top:10px"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;letter-spacing:0;color:#333333;font-size:12px">If you didn't request to reset your&nbsp;password, please disregard this message or contact our customer service department.</p></td></tr></table></td></tr></table></td></tr></table></td></tr></table>
         <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important"><tr><td class="es-info-area" align="center" style="padding:0;Margin:0"><table class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" bgcolor="#FFFFFF" role="none"><tr><td align="left" style="padding:20px;Margin:0"><table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr>
        <td align="center" valign="top" style="padding:0;Margin:0;width:560px"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr><td align="center" class="es-infoblock" style="padding:0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;letter-spacing:0;color:#CCCCCC;font-size:12px"><a target="_blank" href="" style="mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px"></a>No longer want to receive these emails?&nbsp;<a href="" target="_blank" style="mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px">Unsubscribe</a>.<a target="_blank" href="" style="mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px"></a></p> </td></tr></table></td></tr></table>
        </td></tr></table></td></tr></table></td></tr></table></div></body></html>`

        await transporter.sendMail({
            from: fromMail, // sender address
            to: reciverEmail, // list of receivers
            subject: "Reset Password", // Subject line
            text: `Your password is ${password}`, // plain text body
            html: template, // html body
        });

    } catch (err) {
        console.log(err)
    }

}

export async function mailForFeasibleTimeline(reciverEmail: string, data: any) {
    try {

        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Inquiry</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333333;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background-color: #007bff;
            color: #ffffff;
            text-align: center;
            padding: 20px;
        }
        .content {
            padding: 20px;
        }
        .footer {
            background-color: #f4f4f4;
            text-align: center;
            padding: 10px;
            font-size: 12px;
            color: #777777;
        }
        .button {
            display: inline-block;
            margin: 20px 0;
            padding: 10px 20px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
        }
        .button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Content -->
        <div class="content">
            <p>Hi Team,</p>
            <p>
                I understand that the deadline for shortlisting this project has passed. However, I would still like to explore this opportunity further. 
                Could you please confirm if there is still a feasible timeline available?
            </p>
            <p><strong>Project Name:</strong> ${data.projectName}</p>
            <p><strong>BOS ID:</strong> ${data.BOSID}</p>
            <p><strong>Supplier Name:</strong> ${data.supplierName}</p>
            <p>Thank you!</p>
        </div>

    </div>
</body>
</html>
`

        await transporter.sendMail({
            from: fromMail,
            to: reciverEmail, // list of receivers
            subject: "Project Inquiry", // Subject line
            text: `I understand that the deadline for shortlisting this project has passed. However, I would still like to explore this opportunity further. Could you please confirm if there is still a feasible timeline available?`, // plain text body
            html: template, // html body
        });

    } catch (err) {
        console.log(err)
    }

}

export async function mailForNewProject(reciverEmail: string, data: any,) {
    try {

        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WestGate IT Hub Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f9;
            color: #333;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: auto;
            background-color: #ffffff;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            background-color: #0078d4;
            color: white;
            text-align: center;
            padding: 20px;
        }
        .content {
            padding: 20px;
        }
        .footer {
            text-align: center;
            font-size: 0.9em;
            color: #555;
            padding: 10px 0;
            border-top: 1px solid #ddd;
        }
        a {
            color: #0078d4;
            text-decoration: none;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #0078d4;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .button:hover {
            background-color: #005ea6;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="content">
            <p>Dear ${data.supplierName},</p>
            <p>This is an automated message from WestGate IT Hub. New projects have been posted on the OSS System. Please log in to the portal to review and shortlist opportunities of interest.</p>
            <p>For any questions or assistance with bidding, contact us at <a href="mailto:subham@westgateithub.com">subham@westgateithub.com</a> or <strong>7781978685</strong>.</p>
            <p>We appreciate your partnership and look forward to your participation!</p>
        </div>
        <div class="footer">
            <p>Best regards,</p>
            <p>WestGate IT Hub</p>
        </div>
    </div>
</body>
</html>`

        await transporter.sendMail({
            from: fromMail,
            to: reciverEmail, // list of receivers
            subject: "New Projects Available on OSS System", // Subject line
            text: `I understand that the deadline for shortlisting this project has passed. However, I would still like to explore this opportunity further. Could you please confirm if there is still a feasible timeline available?`, // plain text body
            html: template, // html body
        });

    } catch (err) {
        console.log(err)
    }

}

export async function sendContactEmail(recipientEmail: string, formData: any) {
    try {
        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Inquiry</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; }
        .email-container { max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
        .header { background-color: #0078d4; color: white; text-align: center; padding: 20px; font-size: 20px; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 0.9em; color: #555; padding: 10px 0; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">New Contact Inquiry</div>
        <div class="content">
            <p><strong>Full Name:</strong> ${formData?.fullName}</p>
            <p><strong>Email Address:</strong> ${formData?.email}</p>
            <p><strong>Company Name:</strong> ${formData?.companyName}</p>
            ${formData?.phone ? `<p><strong>Phone Number:</strong> ${formData?.phone}</p>` : ''}
            <p><strong>Subject:</strong> ${formData?.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${formData?.message}</p>
        </div>
        <div class="footer">
            <p>Thank you for reaching out!</p>
        </div>
    </div>
</body>
</html>`;

        await transporter.sendMail({
            from: fromMail, // Replace with your email
            to: recipientEmail,
            subject: `New Contact Inquiry`,
            text: `New inquiry received from ${formData?.fullName}. Email: ${formData?.email}. Message: ${formData?.message}`,
            html: template,
        });

        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

// Mail Configuration
export const transporterTest = nodemailer.createTransport({
    host: "smtpout.secureserver.net",
    port: 587,
    secure: false, // use STARTTLS
    auth: {
        user: "no-reply@westgateithub.in",  // your email
        pass: "Abhishek23*",        // app password or mailbox password
    }
});

// Function to be used for the send mail to new register supplier for reset password 
export async function sendRegisterMailToSupplier(receiverEmail: string) {
    try {
        const resetLink = `https://supplier.westgateithub.com/#/reset-password?email=${receiverEmail}`;
        // const resetLink = `http://localhost:3000/#/update-profile?email=${receiverEmail}`;

        const template = `
            <!DOCTYPE html>
            <html>

            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                    }

                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }

                    .header {
                        text-align: center;
                        padding: 20px 0;
                    }

                    .content {
                        padding: 20px;
                        background-color: #ffffff;
                    }

                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #0078d4;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 4px;
                        margin: 20px 0;
                    }

                    .footer {
                        text-align: center;
                        padding: 20px;
                        font-size: 14px;
                        color: #666666;
                    }
                </style>
            </head>

            <body>
                <div class="container">
                    <div class="content">
                        <h2>Your Profile is Activated – Please Set Your Password</h2>

                        <p>Dear Supplier,</p>

                        <p>This is an auto-generated email to inform you that your profile has been successfully activated on the
                            WestGate IT Hub supplier portal</p>

                        <p>
                            To begin using your account, please follow the steps below:
                        </p>

                        <h3> <b> 1. Set your password </b></h3>
                        <p>Click the button below to set your password and gain access to the portal.</p>
                        <a href="${resetLink}" class="button" style="color: #ffffff;">Set Your Password</a>

                        <h3> <b> 2. Login to the portal </b> </h3>
                        <p>Once your password is set, you can log in here:<br>
                            <a href="https://supplier.westgateithub.com/">https://supplier.westgateithub.com/</a>
                        </p>

                        <h3> <b> 3. Manage Your Work: </b> </h3>
                        <p>After logging in, you will be able to:</p>
                        <ul>
                            <li> Track project progress </li>
                            <li> View updates and timelines </li>
                            <li> Manage assigned tasks efficiently </li>
                        </ul>

                        <p>If you have any questions or experience any issues, please contact our support team. This email was
                            generated automatically — please do not reply directly.</p>

                        <p>We look forward to collaborating with you.</p>

                        <p> <b> Best regards </b>, <br>
                            <i> WestGate IT Hub (P) Ltd </i></p>
                    </div>
                </div>
            </body>
            </html>`;

        await transporterTest.sendMail({
            from: "no-reply@westgateithub.in",
            to: receiverEmail,
            subject: "Your Profile is Activated – Please Set Your Password",
            text: `Your profile has been activated. Please set your password by visiting: ${resetLink}`,
            html: template,
        });
    } catch (error) {
        console.log(`Facing error while sending mail to supplier admin ${receiverEmail} : `, error);
    }
}

// Function to be used for the send mail for update the profile for supplier
export async function sendMailForProfileUpdate(receiverEmail: string, id: string) {
    try {
        const updateProfileLink = `https://supplier.westgateithub.com/#/update-profile?id=${id}`;
        // const updateProfileLink = `http://localhost:3000/#/update-profile?id=${id}`;

        const template = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                    }
                    .content {
                        padding: 20px;
                        background-color: #ffffff;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #0078d4;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 4px;
                        margin: 20px 0;
                    }
                    .footer {
                        text-align: center;
                        padding: 20px;
                        font-size: 14px;
                        color: #666666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <h2>Action Required – Please Update Your Profile</h2>
                        
                        <p>Dear User,</p>
                        
                        <p>This is an auto-generated email to notify you that your profile requires an update on our portal. To ensure we have accurate and up-to-date information, please take a moment to review and update your profile.</p>
                        
                        <h3>Update your profile:</h3>
                        <p>Click the button below to update your profile. A new tab will open to guide you through the update process.</p>
                        <a href="${updateProfileLink}" target="_blank" class="button" style="color: #ffffff;">Update Your Profile</a>
                        
                        <h3>Need help?</h3>
                        <p>If you experience any issues or have questions about updating your profile, feel free to reach out to our support team.</p>
                        
                        <p>Thank you for keeping your information up to date. We appreciate your cooperation!</p>
                        
                        <p>Best regards,<br>
                        WestGate IT Hub (P) Ltd</p>
                    </div>
                </div>
            </body>
            </html>`;

        await transporterTest.sendMail({
            from: "no-reply@westgateithub.in",
            to: receiverEmail,
            subject: "Your Profile Requires an Update – Action Needed",
            text: `Your profile requires an update. Please visit the following link to update your profile:: ${updateProfileLink}`,
            html: template,
        });
        console.log("sendMailForProfileUpdate Mail Send Successfully for profile update")
    } catch (error) {
        console.log(`Facing error while sending mail to supplier admin ${receiverEmail} : `, error);
    }
}

// Function to be used for the send mail to new register supplier for reset password 
export async function sendMailForInactiveSupplier(receiverEmail: string) {
    try {
        const template = `<!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                    }

                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }

                    .header {
                        text-align: center;
                        padding: 20px 0;
                    }

                    .content {
                        padding: 20px;
                        background-color: #ffffff;
                    }

                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #0078d4;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 4px;
                        margin: 20px 0;
                    }

                    .footer {
                        text-align: center;
                        padding: 20px;
                        font-size: 14px;
                        color: #666666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <h2>Notice: Your Profile Has Been Removed from Our Preferred Supplier List</h2>
                        <p>Dear Supplier,</p>
                        <p>This is an auto-generated email to inform you that your profile has been removed from the Preferred
                            Supplier List on our portal.</p>

                        <p>If you believe this action was taken in error, please contact our support team for assistance.</p>
                        <p>
                            <b> Note: </b> You will retain limited access to your account but may no longer be eligible for new
                            opportunities unless reinstated
                        </p>
                        <p> <b> Best regards </b>, <br>
                            <i> WestGate IT Hub (P) Ltd </i>
                        </p>
                    </div>
                </div>
            </body>
            </html>`;

        await transporterTest.sendMail({
            from: "no-reply@westgateithub.in",
            to: receiverEmail,
            subject: "Notice: Your Profile Has Been Removed from Our Preferred Supplier List",
            text: `Notice: Your Profile Has Been Removed from Our Preferred Supplier List`,
            html: template,
        });
    } catch (error) {
        console.log(`Facing error while sending mail to supplier admin ${receiverEmail} : `, error);
    }
}resetSupplierPassword

// Function to be used for the send mail to new register supplier for reset password 
export async function resetSupplierPassword(receiverEmail: string) {
    try {
        const resetLink = `https://supplier.westgateithub.com/#/reset-password?email=${receiverEmail}`;
        // const resetLink = `http://localhost:3000/#/update-profile?email=${receiverEmail}`;

        const template = `
           <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                    }

                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }

                    .header {
                        text-align: center;
                        padding: 20px 0;
                    }

                    .content {
                        padding: 20px;
                        background-color: #ffffff;
                    }

                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #0078d4;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 4px;
                        margin: 20px 0;
                    }

                    .footer {
                        text-align: center;
                        padding: 20px;
                        font-size: 14px;
                        color: #666666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <h2>Password Reset Request – Action Required</h2>
                        <p> <b> Dear Supplier, </b> </p>
                        <p>This is an auto-generated email to inform you that a request to reset your password was received.</p>
                        <p>
                            To set a new password, please click the link below:
                        </p>
                        <a href="${resetLink}" class="button" style="color: #ffffff;">Reset Your Password</a>

                        <p>If you did not request this change, please ignore this email or contact support immediately.</p>

                        <p> <b> Best regards </b>, <br>
                            <i> WestGate IT Hub (P) Ltd </i>
                        </p>
                    </div>
                </div>
            </body>
            </html>`;

        await transporterTest.sendMail({
            from: "no-reply@westgateithub.in",
            to: receiverEmail,
            subject: "Password Reset Request – Action Required",
            text: `Password Reset Request – Action Required: ${resetLink}`,
            html: template,
        });
        console.log("Reset mail send successfully");
    } catch (error) {
        console.log(`Facing error while sending mail to supplier admin ${receiverEmail} : `, error);
    }
}

// Mail 1 - Shortlist notification
export async function sendShortlistMail(receiverEmail: string, supplierName: string, projectData: any, bidManagerData: any) {
    try {
        const projectLink = `https://supplier.westgateithub.com/#/project-details/${projectData._id}`;

        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Action Required: You've Been Shortlisted</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
        .header { background-color: #0078d4; color: white; text-align: center; padding: 20px; font-size: 20px; }
        .content { padding: 20px; line-height: 1.6; }
        .project-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .bid-manager { background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; font-size: 0.9em; color: #555; padding: 20px; border-top: 1px solid #ddd; }
        .important { color: #d73527; font-weight: bold; }
        ul { padding-left: 20px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            Action Required: You've Been Shortlisted for a New Project
        </div>
        <div class="content">
            <p>Dear ${supplierName},</p>
            <p><strong>THIS IS A SYSTEM GENERATED EMAIL - DO NOT REPLY</strong></p>

            <p>We're pleased to inform you that your organisation has been <strong>shortlisted</strong> for the following project:</p>

            <div class="project-details">
                <ul>
                    <li><strong>Project Name:</strong> ${projectData.projectName}</li>
                    <li><strong>Client:</strong> ${projectData.clientName || 'N/A'}</li>
                    <li><strong>Due Date:</strong> ${projectData.dueDate ? new Date(projectData.dueDate).toLocaleDateString() : 'N/A'}</li>
                    <li><strong>Project Link:</strong> <a href="${projectLink}">${projectLink}</a></li>
                </ul>
            </div>

            <p>To proceed, please log in to the supplier portal and navigate to the "Shortlisting" section. There, you can view the project details, swipe down to see the eligibility criteria, and use the Confirm or Decline button to submit your response.</p>

            <p class="important">Important: Confirmation must be submitted by 2 working days. If we do not receive your response by then, the project will be reassigned to other suppliers.</p>

            <div class="bid-manager">
                <strong>Assigned Bid Manager:</strong>
                <ul>
                    <li><strong>Name:</strong> ${bidManagerData?.name || 'N/A'}</li>
                    <li><strong>Email:</strong> ${bidManagerData?.email || 'N/A'}</li>
                    <li><strong>Contact Number:</strong> ${bidManagerData?.mobileNumber || 'N/A'}</li>
                </ul>
            </div>

            <p>If eligible and you confirm participation, our bid manager will be in touch to schedule a handover call and guide you through the submission process.</p>

            <p>We look forward to your response.</p>

            <p>Best regards,<br>Team WestGate</p>
        </div>
        <div class="footer">
            <p>© 2025 WestGate IT Hub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

        await transporterTest.sendMail({
            from: "no-reply@westgateithub.in",
            to: receiverEmail,
            subject: "Action Required: You've Been Shortlisted for a New Project",
            text: `You've been shortlisted for project: ${projectData.projectName}. Please check the supplier portal.`,
            html: template,
        });

        console.log("Shortlist mail sent successfully");
    } catch (error) {
        console.log(`Error sending shortlist mail: `, error);
    }
}

// Mail 2 - Comment on shortlist
export async function sendShortlistCommentMail(receiverEmail: string, supplierName: string, projectData: any, bidManagerData: any) {
    try {
        const projectLink = `https://supplier.westgateithub.com/#/project-details/${projectData._id}`;

        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Update Available: Shortlisted Project Status</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
        .header { background-color: #0078d4; color: white; text-align: center; padding: 20px; font-size: 20px; }
        .content { padding: 20px; line-height: 1.6; }
        .project-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .bid-manager { background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; font-size: 0.9em; color: #555; padding: 20px; border-top: 1px solid #ddd; }
        .important { color: #d73527; font-weight: bold; }
        ul { padding-left: 20px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            Update Available: Shortlisted Project Status
        </div>
        <div class="content">
            <p>Dear ${supplierName},</p>
            <p><strong>THIS IS A SYSTEM-GENERATED EMAIL – DO NOT REPLY</strong></p>

            <p>There's a new update on the project you are shortlisted:</p>

            <div class="project-details">
                <ul>
                    <li><strong>Project Name:</strong> ${projectData.projectName}</li>
                    <li><strong>Client:</strong> ${projectData.clientName || 'N/A'}</li>
                    <li><strong>Due Date:</strong> ${projectData.dueDate ? new Date(projectData.dueDate).toLocaleDateString() : 'N/A'}</li>
                    <li><strong>Project Link:</strong> <a href="${projectLink}">${projectLink}</a></li>
                </ul>
            </div>

            <p>Please log in to the supplier portal and go to the "Registered Interest" section under "Projects." Open the project to review the latest update from our team.</p>

            <p class="important">Important: Please check the update and respond within 1 working day. If we do not receive your response in time, your participation in this project may be affected.</p>

            <div class="bid-manager">
                <strong>Assigned Bid Manager:</strong>
                <ul>
                    <li><strong>Name:</strong> ${bidManagerData?.name || 'N/A'}</li>
                    <li><strong>Email:</strong> ${bidManagerData?.email || 'N/A'}</li>
                    <li><strong>Contact Number:</strong> ${bidManagerData?.mobileNumber || 'N/A'}</li>
                </ul>
            </div>

            <p>Once you respond, the bid manager will review your reply and follow up if needed.</p>

            <p>Best regards,<br>Team WestGate</p>
        </div>
        <div class="footer">
            <p>© 2025 WestGate IT Hub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

        await transporterTest.sendMail({
            from: "no-reply@westgateithub.in",
            to: receiverEmail, 
            subject: "Update Available: Shortlisted Project Status",
            text: `There's a new update on the project you are shortlisted: ${projectData.projectName}. Please check the supplier portal.`,
            html: template,
        });

        console.log("Shortlist comment mail sent successfully");
    } catch (error) {
        console.log(`Error sending shortlist comment mail: `, error);
    }
}

// Mail 3 - Comment on registered interest
export async function sendRegisteredInterestCommentMail(receiverEmail: string, supplierName: string, projectData: any, bidManagerData: any) {
    try {
        const projectLink = `https://supplier.westgateithub.com/#/project-details/${projectData._id}`;

        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Action Required: Comment on Registered Interest Project</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
        .header { background-color: #0078d4; color: white; text-align: center; padding: 20px; font-size: 20px; }
        .content { padding: 20px; line-height: 1.6; }
        .project-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .bid-manager { background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; font-size: 0.9em; color: #555; padding: 20px; border-top: 1px solid #ddd; }
        .important { color: #d73527; font-weight: bold; }
        ul { padding-left: 20px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            Action Required: You've Received a Comment on the Project you Registered Interest
        </div>
        <div class="content">
            <p>Dear ${supplierName},</p>
            <p><strong>THIS IS A SYSTEM GENERATED EMAIL - DO NOT REPLY</strong></p>

            <p>You've received a comment for the following project you previously registered interest in:</p>

            <div class="project-details">
                <ul>
                    <li><strong>Project Name:</strong> ${projectData.projectName}</li>
                    <li><strong>Client:</strong> ${projectData.clientName || 'N/A'}</li>
                    <li><strong>Due Date:</strong> ${projectData.dueDate ? new Date(projectData.dueDate).toLocaleDateString() : 'N/A'}</li>
                    <li><strong>Project Link:</strong> <a href="${projectLink}">${projectLink}</a></li>
                </ul>
            </div>

            <p>To view the comment, please log in to the supplier portal and navigate to the "Registered Interest" section under "Projects". Open the project, scroll down to the comments area, and review the latest note from our team.</p>

            <p class="important">Important: Please respond to the comment within 2 working days. If we do not receive your update in time, your participation in this project may be affected.</p>

            <div class="bid-manager">
                <strong>Assigned Bid Manager:</strong>
                <ul>
                    <li><strong>Name:</strong> ${bidManagerData?.name || 'N/A'}</li>
                    <li><strong>Email:</strong> ${bidManagerData?.email || 'N/A'}</li>
                    <li><strong>Contact Number:</strong> ${bidManagerData?.mobileNumber || 'N/A'}</li>
                </ul>
            </div>

            <p>Once you respond, our bid manager will review your reply and follow up if further action is needed.</p>

            <p>Best regards,<br>Team WestGate</p>
        </div>
        <div class="footer">
            <p>© 2025 WestGate IT Hub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

        await transporterTest.sendMail({
            from: "no-reply@westgateithub.in",
            to: receiverEmail,
            subject: "Action Required: You've Received a Comment on the Project you Registered Interest",
            text: `You've received a comment for the project you registered interest in: ${projectData.projectName}. Please check the supplier portal.`,
            html: template,
        });

        console.log("Registered interest comment mail sent successfully");
    } catch (error) {
        console.log(`Error sending registered interest comment mail: `, error);
    }
}