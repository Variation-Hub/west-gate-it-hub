import { Request, Response } from "express"
import { generateToken } from "../Util/JwtAuth"
import { comparepassword } from "../Util/bcrypt"
import webUserModel from "../Models/webUserModel"
import { fromMail, transporter } from "../Util/nodemailer"
import userModel from "../Models/userModel"
import { subExpertise, userRoles } from "../Util/contant"
import LoginModel from "../Models/LoginModel"
import FileModel from "../Models/fileModel"
import { deleteFromBackblazeB2, uploadToBackblazeB2 } from "../Util/aws";
import mongoose from "mongoose";
import masterList from "../Models/masterList";

const sendMail = async (data: any) => {

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
        from: fromMail,
        to: process.env.ADMIN_EMAIL,
        subject: "Form Submission",
        text: `New user Registration`,
        html: template,
    });

}

export const registerWebUser = async (req: Request, res: Response) => {
    try {
        const { email } = req.body
        const user = await userModel.findOne({ email })

        if (user) {
            return res.status(400).json({
                message: "User already exists",
                status: false,
                data: null
            })
        }

        if (!Array.isArray(req.body?.expertise)) {
            return res.status(400).json({ message: "Expertise must be an array", status: false });
        }

        req.body.role = userRoles.SupplierAdmin
        const newUser: any = await userModel.create(req.body)

        await sendMail(req.body)

        const token = generateToken({
            id: newUser._id,
            ...newUser._doc
            //  email: newUser.email,
            //  name: newUser.name, 
            //  role: newUser.role,
            //  userName: newUser.userName,
            //  plan: newUser.plan 
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
        const user: any = await userModel.findOne({ email: email.toLowerCase(), role: userRoles.SupplierAdmin })

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

        const token = generateToken({
            id: user._id,
            ...user._doc
            // email: user.email,
            // name: user.name,
            // role: user.role,
            // userName: user.userName,
            // plan: user.plan
        })

        if (user.role === userRoles.SupplierAdmin) {
            await LoginModel.create({ userId: user._id })
        }
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

        await sendMail(req.body)

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

export const getWebUser = async (req: any, res: Response) => {
    try {
        const userID = req.user.id;

        const user = await userModel.findById(userID).select({ password: 0 });;

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        return res.status(200).json({
            message: "User detail fetch success",
            status: true,
            data: user
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

export const uploadFile = async (req: any, res: Response) => {
    try {
        const userId = req.user?.id;
        //console.log(req.user)
        const { expertise, subExpertise, supplierId } = req.body;
        const files = req.files;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized", status: false });
        }
        //console.log(files)
        if (!files || !expertise || !subExpertise) {
            return res.status(400).json({ message: "File, expertise, and sub-expertise are required", status: false });
        }

        const user: any = await userModel.findOne({ _id: userId })

        if (!user) {
            return res.status(404).json({ message: "user not found", status: false })
        }

        if (!supplierId) {
            return res.status(400).json({
                message: "Supplier ID is required",
                status: false
            });
        }

        const supplier = await userModel.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({
                message: "Supplier not found",
                status: false
            });
        }

        const expertiseData = supplier.expertise.find(exp => exp.name === expertise);
        if (!expertiseData) {
            return res.status(400).json({ message: `Expertise '${expertise}' does not exist for this supplier.`, status: false });
        }
        if (!expertiseData.subExpertise || !expertiseData.subExpertise.includes(subExpertise)) {
            return res.status(400).json({ message: `Sub-expertise '${subExpertise}' does not exist under '${expertise}'.`, status: false });
        }

        let uploadedFilesData = [];

        for (const file of files) {
            const uploadedFile = await uploadToBackblazeB2(file, `user_${userId}`);

            const newFile = new FileModel({
                userId,
                supplierId,
                expertise,
                subExpertise,
                fileUrl: uploadedFile.url,
                fileName: uploadedFile.fileName,
                key: uploadedFile.key
            });

            await newFile.save();
            uploadedFilesData.push(newFile);
        }

        return res.status(201).json({
            message: "File uploaded successfully",
            status: true,
            data: uploadedFilesData
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};

export const deleteFile = async (req: Request, res: Response) => {
    try {
        const { fileId } = req.body;

        if (!fileId) {
            return res.status(400).json({ message: "File ID is required", status: false });
        }

        // Find file record in the database
        const file = await FileModel.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: "File not found", status: false });
        }

        // Delete from BackblazeB2
        const fileKey = { key: file.key };
        const deleteResponse = await deleteFromBackblazeB2(fileKey);

        // Remove file from database
        await FileModel.deleteOne({ _id: fileId });

        return res.status(200).json({
            message: "File deleted successfully",
            status: true
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};

export const getAllExpertise = async (req: any, res: Response) => {
    try {
        const { search, supplierId, startDate, endDate } = req.query;

        const matchStage: any = {};
        if (supplierId) {
            matchStage._id = new mongoose.Types.ObjectId(supplierId);;
        }

        if (startDate && endDate) {
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999);
            matchStage.createdAt = { $gte: start, $lte: end };
        }

        const expertiseData = await userModel.aggregate([
            { $match: matchStage },
            { $unwind: { path: "$expertise", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$expertise.subExpertise", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$expertise.name",
                    totalSupplierCount: { $sum: 1 },
                    activeSupplierCount: { $sum: { $cond: [{ $eq: ["$active", true] }, 1, 0] } },
                    subExpertiseList: { 
                        $addToSet: { 
                            $cond: { if: { $ne: ["$expertise.subExpertise", null] }, then: "$expertise.subExpertise", else: "$$REMOVE" } 
                        }
                    }
                }
            },

            {
                $project: {
                    _id: 0,
                    expertise: "$_id",
                    totalSupplierCount: 1,
                    activeSupplierCount: 1,
                    subExpertiseList: { $ifNull: ["$subExpertiseList", []] },  // Ensure it's an array
                    subExpertiseCount: { $size: { $ifNull: ["$subExpertiseList", []] } }
                }
            },
            { $sort: { expertise: 1 } }
        ]);

        const files = await FileModel.find({});

// Attach related files to subExpertise
let finalExpertiseList = expertiseData.map(exp => {
    const updatedSubExpertiseList = exp.subExpertiseList.map((subExp: any) => {
        const relatedFiles = files.filter(file => file.subExpertise?.includes(subExp));
        return { name: subExp, files: relatedFiles };
    });

    return { ...exp, subExpertiseList: updatedSubExpertiseList };
});

finalExpertiseList = finalExpertiseList.filter(exp => exp.expertise !== null);

if (search) {
    const searchRegex = new RegExp(search as string, "i");
    finalExpertiseList = finalExpertiseList.filter(exp => searchRegex.test(exp.expertise));
}

        return res.status(200).json({
            message: "Expertise list fetched successfully",
            status: true,
            data: finalExpertiseList
        });

    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
};

export const getSuppliersByExpertise = async (req: any, res: Response) => {
    try {
        const { expertise, subExpertise } = req.query;

        if (!expertise) {
            return res.status(400).json({
                message: "Expertise is required",
                status: false
            });
        }
        const matchCriteria: any = { "expertise.name": expertise };
        if (subExpertise) {
            matchCriteria["expertise.subExpertise"] = subExpertise;
        }

        const suppliersWithFiles = await userModel.aggregate([
            {
                $match: matchCriteria
            },
            {
                $lookup: {
                    from: "files",
                    localField: "_id",
                    foreignField: "supplierId",
                    as: "files"
                }
            },
            {
                $addFields: {
                    files: {
                        $filter: {
                            input: "$files",
                            as: "file",
                            cond: {
                                $and: [
                                    { $eq: ["$$file.expertise", expertise] },
                                    subExpertise ? { $eq: ["$$file.subExpertise", subExpertise] } : {}
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    supplier: {
                        _id: "$_id",
                        name: "$name",
                        expertise: "$expertise"
                    },
                    files: 1
                }
            }
        ]);

        if (suppliersWithFiles.length === 0) {
            return res.status(404).json({
                message: "No suppliers found with this expertise and subExpertise",
                status: false
            });
        }


        return res.status(200).json({
            message: "Suppliers and files fetched successfully",
            status: true,
            data: suppliersWithFiles
        });

    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};

export const updateSupplierExpertise = async (req: any, res: Response) => {
    try {
      const { supplierId, expertise } = req.body;
  
      if (!supplierId || !Array.isArray(expertise) || expertise.length === 0) {
        return res.status(400).json({
          message: "Supplier ID and expertise list are required",
          status: false
        });
      }
  
      const supplier = await userModel.findById(supplierId);
      if (!supplier) {
        return res.status(404).json({
          message: "Supplier not found",
          status: false
        });
      }
  
      const existingItemIds = supplier.expertise.map((e: any) => e.itemId.toString());
  
      const newExpertise = expertise
        .filter((exp: any) => !existingItemIds.includes(exp.itemId))
        .map((exp: any) => ({
          itemId: exp.itemId,
          name: exp.name,
          type: exp.type,
          subExpertise: []
        }));
  
      if (newExpertise.length === 0) {
        return res.status(400).json({
          message: "All expertise already exist. Nothing to update.",
          status: false
        });
      }
  
      supplier.expertise.push(...newExpertise);
      await supplier.save();
  
      return res.status(200).json({
        message: "Expertise updated successfully",
        status: true,
        data: supplier.expertise
      });
  
    } catch (err: any) {
      return res.status(500).json({
        message: err.message,
        status: false
      });
    }
};

export const getAlldata = async (req: any, res: Response) => {
    try {
        const { type, search } = req.query;

        const queryObj: any = {}; 

        if (type === "other") {
            queryObj["type"] = { $regex: "-other$", $options: "i" };
        } else if (type) {
            queryObj["type"] = { $regex: `^${type}$`, $options: "i" };
        }

        if (search) {
            const searchRegex = new RegExp(search, "i");
            queryObj["name"] = { $regex: searchRegex };
        }

        const count = await masterList.countDocuments(queryObj);

        const data = await masterList.find(queryObj)
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Data successfully fetched",
            status: true,
            data: data,
            meta_data: {
                page: req.pagination?.page,
                items: count,
                page_size: req.pagination?.limit,
                pages: Math.ceil(count / (req.pagination?.limit as number))
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Error fetching candidates",
            status: false,
            error: error.message
        });
    }
};

export const promoteOtherItem = async (req: any, res: Response) => {
    try {
      const { itemId, promoteToType } = req.body;
  
      if (!itemId || !promoteToType) {
        return res.status(400).json({ message: "Missing data", status: false });
      }
  
      const validTypes = ["domain", "technologies", "product"];
      if (!validTypes.includes(promoteToType)) {
        return res.status(400).json({ message: "Invalid type", status: false });
      }
  
      const updated = await masterList.findByIdAndUpdate(
        itemId,
        { type: promoteToType },
        { new: true }
      );
  
      if (!updated) {
        return res.status(404).json({ message: "Item not found", status: false });
      }
  
      return res.status(200).json({
        message: "Item promoted successfully",
        status: true,
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Internal Server Error",
        status: false,
        error: error.message,
      });
    }
};

export const addCustomItem = async (req: any, res: Response) => {
    try {
      const { name, type } = req.body;
  
      if (!name || !type) {
        return res.status(400).json({ message: "Name and type required", status: false });
      }
  
      const validTypes = [ "domain", "technologies", "product" ];
  
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid type", status: false });
      }
  
      const exists = await masterList.findOne({ name: name.trim(), type });
      if (exists) {
        return res.status(409).json({ message: "Item already exists", status: false });
      }
  
      const newItem = await masterList.create({
        name: name.trim(),
        type,
        isSystem: false,
      });
  
      return res.status(201).json({
        message: "Item added successfully",
        status: true,
        data: newItem,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Error adding item",
        status: false,
        error: error.message,
      });
    }
};

export const getAllSubExpertise = async (req: any, res: Response) => {
    try {
        const { search } = req.query;

        let filteredData = subExpertise;

        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = subExpertise.filter((item) =>
                item.toLowerCase().includes(searchLower)
            );
        }

        return res.status(200).json({
            message: "Sub expertise list fetched successfully",
            status: true,
            data: filteredData
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to fetch sub expertise",
            status: false,
            data: []
        });
    }
};

export const addSubExpertiseToSupplier = async (req: any, res: Response) => {
    try {
        const { supplierId, expertise, subExpertise } = req.body;

        if (!supplierId || !expertise || !Array.isArray(subExpertise) || subExpertise.length === 0) {
            return res.status(400).json({
                message: "Supplier ID, expertise, and subExpertise array are required",
                status: false
            });
        }

        const supplier = await userModel.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({
                message: "Supplier not found",
                status: false
            });
        }

        const expertiseList = supplier.expertise.find(
            (e: any) => e.name.toLowerCase() === expertise.toLowerCase()
        );

        if (!expertiseList) {
            return res.status(400).json({
                message: `Expertise '${expertise}' not found for this supplier`,
                status: false
            });
        }

        const existingSub = expertiseList.subExpertise || [];
        const newSub = subExpertise.filter((s: string) => !existingSub.includes(s));

        if (newSub.length === 0) {
            return res.status(400).json({
                message: "All subExpertise already exist. Nothing to update.",
                status: false
            });
        }

        expertiseList.subExpertise.push(...newSub);

        await supplier.save();

        return res.status(200).json({
            message: "SubExpertise added successfully",
            status: true,
            data: supplier.expertise
        });

    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to add subExpertise",
            status: false
        });
    }
};

export const deleteExpertise = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
              status: false,
              message: 'Invalid itemId format',
            });
        }

        const user: any = await userModel.findById(userId);
        if (!user) return res.status(404).json({ status: false, message: "User not found" });

        const expertiseItem = user.expertise.find((exp: any) => exp.itemId.toString() === itemId);
        if (!expertiseItem) return res.status(404).json({ status: false, message: "Expertise not found" });

        await userModel.updateOne(
            { _id: userId },
            { $pull: { expertise: { itemId } } }
        );

        // delete related files
        await FileModel.deleteMany({ supplierId: userId, expertise: expertiseItem.name });

        return res.status(200).json({
            message: "Expertise deleted successfully",
            status: true
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Failed to delete expertise",
            status: false,
            error: error.message
        });
    }
};

export const deleteSubExpertise = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        const { subExpertise } = req.body;

        if (!subExpertise)
            return res.status(400).json({ message: "subExpertise is required", status: false });

        const user: any = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found", status: false });

        const expertiseItem = user.expertise.find((exp: any) => exp.itemId.toString() === itemId);
        if (!expertiseItem) return res.status(404).json({ message: "Expertise not found", status: false });
        console.log(expertiseItem)
        await userModel.updateOne(
            { _id: userId, "expertise.itemId": itemId },
            { $pull: { "expertise.$.subExpertise": subExpertise } }
        );
        console.log({userId, expertise: expertiseItem.name, subExpertise})
        const result = await FileModel.deleteMany({ supplierId: userId, expertise: expertiseItem.name, subExpertise });
        console.log(result)

        return res.status(200).json({
            message: "Sub-expertise deleted successfully",
            status: true
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Failed to delete sub-expertise",
            status: false,
            error: error.message
        });
    }
};
  