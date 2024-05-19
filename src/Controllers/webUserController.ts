import { Request, Response } from "express"
import { generateToken } from "../Util/JwtAuth"
import { comparepassword } from "../Util/bcrypt"
import webUserModel from "../Models/webUserModel"

export const registerWebUser = async (req: Request, res: Response) => {
    try {
        const { email, name, designation, number, password, companyName, registerNumber, website, numberOfEmployees, industry, numberOfBranch, mainOfficeAddress, companyContactNumber, sector } = req.body
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