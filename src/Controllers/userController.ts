import { Request, Response } from "express"
import userModel from "../Models/userModel"
import { generateToken } from "../Util/JwtAuth"
import { comparepassword } from "../Util/bcrypt"
import { generatePass } from "../Util/contant"
import { emailHelper } from "../Util/nodemailer"

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, name, password } = req.body
        const user = await userModel.findOne({ email })

        if (user) {
            return res.status(400).json({
                message: "Email already exists",
                status: false,
                data: null
            })
        }

        const newUser = await userModel.create({ email, name, password })

        const token = generateToken({ email: newUser.email, name: newUser.name })
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

        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        const deleteUser = await userModel.findByIdAndDelete(id);

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

        const user = await userModel.findOne({email});

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