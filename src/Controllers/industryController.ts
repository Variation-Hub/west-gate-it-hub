import { Request, Response } from "express"
import industryModel from "../Models/industryModel";

export const createIndustry = async (req: any, res: Response) => {
    try {
        let { industry } = req.body;

        const Industry = await industryModel.findOne({ industry })

        if (Industry) {
            return res.status(402).json({
                message: "Industry already exists",
                status: false,
                data: null
            })
        }

        const newIndustry = await industryModel.create({ industry });

        return res.status(200).json({
            message: "Industry created successfully",
            status: true,
            data: newIndustry
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const getIndustryList = async (req: any, res: Response) => {
    try {

        const Industry = await industryModel.find()

        return res.status(200).json({
            message: "Industry fetched successfully",
            status: false,
            data: Industry
        })

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const updateIndustry = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const obj = req.body;

        const Industry: any = await industryModel.findById(id);

        if (!Industry) {
            return res.status(404).json({
                message: "Industry not found",
                status: false,
                data: null
            });
        }

        Object.keys(obj).forEach(value => {
            Industry[value] = obj[value];
        });

        await Industry.save();

        return res.send({
            message: "Industry updated successfully",
            status: true,
            data: Industry
        })
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}
export const deleteIndustry = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const Industry = await industryModel.findByIdAndDelete(id);
        if (!Industry) {
            return res.status(404).json({
                message: "Industry not found",
                status: false,
                data: null
            });
        }
        return res.status(200).json({
            message: "Industry delete success",
            status: true,
            data: Industry
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        })
    }
}
