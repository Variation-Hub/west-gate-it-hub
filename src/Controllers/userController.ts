import { Request, Response } from "express"
import userModel from "../Models/userModel"
import { generateToken } from "../Util/JwtAuth"
import { comparepassword } from "../Util/bcrypt"
import { generatePass, userRoles } from "../Util/contant"
import { emailHelper } from "../Util/nodemailer"
import { deleteFromS3, uploadToS3 } from "../Util/aws"

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, userName } = req.body
        const user = await userModel.findOne({ $or: [{ email }, { userName }] })

        if (user) {
            return res.status(400).json({
                message: "User already exists",
                status: false,
                data: null
            })
        }

        const newUser = await userModel.create(req.body)

        const token = generateToken({
            id: newUser._id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            userName: newUser.userName
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

export const createSuplierUser = async (req: any, res: Response) => {
    try {
        const { userName, email, domain, department } = req.body
        const userId = req.user.id;

        const user = await userModel.findOne({
            $or: [{ email }, { userName }]
        });

        if (user) {
            return res.status(400).json({
                message: "User already exists",
                status: false,
                data: null
            })
        }

        const password = generatePass();
        const newUser = await userModel.create({ userName, email, domain, department, password, role: userRoles.SupplierUser, supplierId: userId })
        emailHelper(email, password).then(data => console.log(data)).catch(err => console.log(err));

        const responseData = {
            email: newUser.email,
            role: newUser.role,
            userName: newUser.userName,
            domain: newUser.domain,
            department: newUser.department,
            supplierId: newUser.supplierId,
            _id: newUser._id,
            doj: newUser.doj,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
        };

        return res.status(200).json({
            message: "User create success",
            status: true,
            data: responseData
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })

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

        const token = generateToken({ id: user._id, email: user.email, name: user.name, role: user.role, userName: user.userName})
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

export const updateUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { name } = req.body
        const user = await userModel.findByIdAndUpdate(id, { name }, { new: true });

        return res.status(200).json({
            message: "User update success",
            status: true,
            data: user
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const deleteUser = await userModel.findByIdAndDelete(id);

        if (!deleteUser) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }


        return res.status(200).json({
            message: "User delete success",
            status: true,
            data: deleteUser
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const userPasswordChange = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { newPassword, oldPassword } = req.body;

        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }
        if (!(await comparepassword(oldPassword, user.password))) {
            return res.status(400).json({
                message: "please enter valid old password",
                status: false,
                data: null
            })
        }
        user.password = newPassword;

        await user.save();

        return res.status(200).json({
            message: "User password update success",
            status: true,
            data: null
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const userForgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        const newPassword = generatePass();
        user.password = newPassword;

        await user.save();
        emailHelper(email, newPassword).then(data => console.log(data)).catch(err => console.log(err));

        return res.status(200).json({
            message: "Email sent successfully",
            status: true,
            data: null
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const fetchSuplierUser = async (req: any, res: Response) => {
    try {

        const supplierId = req.user.id;
        const count = await userModel.countDocuments(
            { role: userRoles.SupplierUser, supplierId },
            { password: 0, categoryList: 0, supplierId: 0 })

        const user = await userModel.find(
            { role: userRoles.SupplierUser, supplierId },
            { password: 0, categoryList: 0, supplierId: 0 })
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number);


        return res.status(200).json({
            message: "User update success",
            status: true,
            data: {
                data: user,
                meta_data: {
                    page: req.pagination?.page,
                    items: count,
                    page_size: req.pagination?.limit,
                    pages: Math.ceil(count / (req.pagination?.limit as number))
                }
            }
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}
export const updateAvatar = async (req: any, res: Response) => {
    try {

        const userId = req.user.id;

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        if (req.file) {
            if (user.avatar) {
                deleteFromS3(user.avatar)
            }
            user.avatar = await uploadToS3(req.file, "cv") as any
        }

        await user.save();

        return res.status(200).json({
            message: "User update success",
            status: true,
            data: user
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const updateSuplierAdmin = async (req: any, res: Response) => {
    try {

        const supplierId = req.user.id;

        const user = await userModel.findById(supplierId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        if (req.file) {
            if (user.cv) {
                deleteFromS3(user.cv)
            }
            user.cv = await uploadToS3(req.file, "cv") as any
        }

        await user.save();

        return res.status(200).json({
            message: "User update success",
            status: true,
            data: user
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}