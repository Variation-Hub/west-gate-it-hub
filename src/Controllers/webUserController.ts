import { Request, Response } from "express"
import { generateToken } from "../Util/JwtAuth"
import { comparepassword } from "../Util/bcrypt"
import webUserModel from "../Models/webUserModel"
import { transporter } from "../Util/nodemailer"

export const registerWebUser = async (req: Request, res: Response) => {
    try {
        const { email } = req.body
        const user = await webUserModel.findOne({ email })

        if (user) {
            return res.status(400).json({
                message: "User already exists",
                status: false,
                data: null
            })
        }

        const newUser = await webUserModel.create(req.body)

        const token = generateToken({
            id: newUser._id,
            email: newUser.email,
            name: newUser.name
        })
        return res.status(200).json({
            message: "User create success",
            status: true,
            data: { token }
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const loginWebUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body
        const user = await webUserModel.findOne({ email: email.toLowerCase() })

        if (!user) {
            return res.status(404).json({
                message: "user not found",
                status: false,
                data: null
            })
        }

        if (!(await comparepassword(password, user.password))) {
            return res.status(400).json({
                message: "please enter valid password",
                status: false,
                data: null
            })
        }

        const token = generateToken({ id: user._id, email: user.email, name: user.name })
        return res.status(200).json({
            message: "User login success",
            status: true,
            data: { token }
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const registerSendMail = async (req: Request, res: Response) => {
    try {

        const data = req.body

        const row = Object.keys(data).map(key => {
            const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
            return `
                <tr>
                    <td align="left" style="padding:5px;Margin:0">
                        <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                            ${capitalizedKey}: ${data[key]}
                        </p>
                    </td>
                </tr>`;
        }).join('');

        const template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"><head><meta charset="UTF-8"><meta content="width=device-width,initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta content="telephone=no" name="format-detection"><title>New Message</title><link href="https://fonts.googleapis.com/css?family=Lora:400,400i,700,700i" rel="stylesheet"><!--<![endif]--><style type="text/css">#outlook a{padding:0}.es-button{mso-style-priority:100!important;text-decoration:none!important}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}.es-desk-hidden{display:none;float:left;overflow:hidden;width:0;max-height:0;line-height:0;mso-hide:all}@media only screen and (max-width:600px){a,ol li,p,ul li{line-height:150%!important}h1,h1 a,h2,h2 a,h3,h3 a{line-height:120%!important}h1{font-size:30px!important;text-align:left}h2{font-size:24px!important;text-align:left}h3{font-size:20px!important;text-align:left}.es-content-body h1 a,.es-footer-body h1 a,.es-header-body h1 a{font-size:30px!important;text-align:left}.es-content-body h2 a,.es-footer-body h2 a,.es-header-body h2 a{font-size:24px!important;text-align:left}.es-content-body h3 a,.es-footer-body h3 a,.es-header-body h3 a{font-size:20px!important;text-align:left}.es-menu td a{font-size:14px!important}.es-header-body a,.es-header-body ol li,.es-header-body p,.es-header-body ul li{font-size:14px!important}.es-content-body a,.es-content-body ol li,.es-content-body p,.es-content-body ul li{font-size:14px!important}.es-footer-body a,.es-footer-body ol li,.es-footer-body p,.es-footer-body ul li{font-size:14px!important}.es-infoblock a,.es-infoblock ol li,.es-infoblock p,.es-infoblock ul li{font-size:12px!important}[class=gmail-fix]{display:none!important}.es-m-txt-c,.es-m-txt-c h1,.es-m-txt-c h2,.es-m-txt-c h3{text-align:center!important}.es-m-txt-r,.es-m-txt-r h1,.es-m-txt-r h2,.es-m-txt-r h3{text-align:right!important}.es-m-txt-l,.es-m-txt-l h1,.es-m-txt-l h2,.es-m-txt-l h3{text-align:left!important}.es-m-txt-c img,.es-m-txt-l img,.es-m-txt-r img{display:inline!important}.es-button-border{display:inline-block!important}a.es-button,button.es-button{font-size:18px!important;display:inline-block!important}.es-adaptive table,.es-left,.es-right{width:100%!important}.es-content,.es-content table,.es-footer,.es-footer table,.es-header,.es-header table{width:100%!important;max-width:600px!important}.es-adapt-td{display:block!important;width:100%!important}.adapt-img{width:100%!important;height:auto!important}.es-m-p0{padding:0!important}.es-m-p0r{padding-right:0!important}.es-m-p0l{padding-left:0!important}.es-m-p0t{padding-top:0!important}.es-m-p0b{padding-bottom:0!important}.es-m-p20b{padding-bottom:20px!important}.es-hidden,.es-mobile-hidden{display:none!important}table.es-desk-hidden,td.es-desk-hidden,tr.es-desk-hidden{width:auto!important;overflow:visible!important;float:none!important;max-height:inherit!important;line-height:inherit!important}tr.es-desk-hidden{display:table-row!important}table.es-desk-hidden{display:table!important}td.es-desk-menu-hidden{display:table-cell!important}.es-menu td{width:1%!important}.esd-block-html table,table.es-table-not-adapt{width:auto!important}table.es-social{display:inline-block!important}table.es-social td{display:inline-block!important}.es-desk-hidden{display:table-row!important;width:auto!important;overflow:visible!important;max-height:inherit!important}}@media screen and (max-width:384px){.mail-message-content{width:414px!important}}</style></head><body style="width:100%;font-family:arial,'helvetica neue',helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"><div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#f6f6f6"><table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#f6f6f6"><tr><td valign="top" style="padding:0;Margin:0"><table class="es-header" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;table-layout:fixed!important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"><tr><td align="center" style="padding:0;Margin:0"><table class="es-header-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;background-color:#fff;width:600px"><tr><td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px"><!--[if mso]><table style="width:560px" cellpadding="0" cellspacing="0"><tr><td style="width:180px" valign="top"><![endif]--><table class="es-left" cellspacing="0" cellpadding="0" align="left" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;float:left"><tr><td class="es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:180px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0"><tr><td style="padding:0;Margin:0;display:none" align="center"></td></tr></table></td></tr></table><!--[if mso]><td style="width:20px"></td><td style="width:360px" valign="top"><![endif]--><table class="es-right" cellspacing="0" cellpadding="0" align="right" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;float:right"><tr><td align="left" style="padding:0;Margin:0;width:360px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0"><tr><td style="padding:0;Margin:0;display:none" align="center"></td></tr></table></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;table-layout:fixed!important;width:100%"><tr><td align="center" style="padding:0;Margin:0"><table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;background-color:#fff;width:600px"><tr><td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0"><tr><td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0"><tr><td align="center" style="padding:0;Margin:0"><h2 style="Margin:0;line-height:29px;mso-line-height-rule:exactly;font-family:arial,'helvetica neue',helvetica,sans-serif;font-size:24px;font-style:normal;font-weight:400;color:#333">WestGate IT Hub</h2></td></tr></table></td></tr></table></td></tr><tr><td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0"><tr><td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0"><tr><td esdev-links-color="#ffffff" align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lora,georgia,'times new roman',serif;line-height:23px;color:#000;font-size:15px"><span style="line-height:120%">User deatils</span></p></td></tr></table></td></tr></table></td></tr></table></td></tr></table><table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;table-layout:fixed!important;width:100%"><tr><td align="center" style="padding:0;Margin:0"><table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;background-color:#fff;width:600px"><tr><td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0"><tr><td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0" id="table-data">${row}</table></td></tr></table></td></tr></table></td></tr></table><table class="es-footer" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;table-layout:fixed!important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"><tr><td align="center" style="padding:0;Margin:0"><table class="es-footer-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;background-color:#fff;width:600px"><tr><td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0"><tr><td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0"><tr><td esdev-links-color="#666666" align="left" style="padding:0;Margin:0;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial,'helvetica neue',helvetica,sans-serif;line-height:21px;color:#666;font-size:14px"><br></p></td></tr><tr><td esdev-links-color="#666666" align="center" style="padding:0;Margin:0;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial,'helvetica neue',helvetica,sans-serif;line-height:21px;color:#666;font-size:14px">If you think this submission is spam, report it as spam</p></td></tr><tr><td esdev-links-color="#666666" align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial,'helvetica neue',helvetica,sans-serif;line-height:21px;color:#666;font-size:14px">Copyright © 2018 Company Name, All Rights Reserved.</p></td></tr></table></td></tr></table></td></tr><tr><td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px"><table class="es-left" cellspacing="0" cellpadding="0" align="left" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;float:left"><tr><td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:270px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0"><tr><td style="padding:0;Margin:0;display:none" align="center"></td></tr></table></td></tr></table><table class="es-right" cellspacing="0" cellpadding="0" align="right" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0;float:right"><tr><td align="left" style="padding:0;Margin:0;width:270px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0;mso-table-rspace:0;border-collapse:collapse;border-spacing:0"><tr><td style="padding:0;Margin:0;display:none" align="center"></td></tr></table></td></tr></table></td></tr></table></td></tr></table></td></tr></table></div></body></html>`



        await transporter.sendMail({
            from: 'service@uncleblock.in',
            to: process.env.ADMIN_EMAIL,
            subject: "Form Submission",
            html: template,
        });

        return res.status(200).json({
            message: "mail send successfully",
            status: true,
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}