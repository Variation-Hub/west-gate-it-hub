import { Request, Response } from "express"
import caseStudyModel from "../Models/caseStudy"
import { uploadToS3 } from "../Util/aws"

export const caseStudyList = async (req: any, res: Response) => {
    try {
        const userId = req.user.id
        let { category } = req.query;
        category = category?.split(',');

        let filter: any = { userId: userId }
        if (category) {
            filter = { ...filter, category: { $in: category } }
        }

        const count = await caseStudyModel.countDocuments(filter);
        const CaseStudy = await caseStudyModel.find(filter)
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "CaseStudy successfully fetched",
            status: true,
            data: {
                data: CaseStudy,
                meta_data: {
                    page: req.pagination?.page,
                    items: count,
                    page_size: req.pagination?.limit,
                    pages: Math.ceil(count / (req.pagination?.limit as number))
                }
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const createCaseStudy = async (req: any, res: Response) => {
    try {
        let { name, category, file, subCategory } = req.body
        const userId = req.user.id

        if (req.file) {
            file = await uploadToS3(req.file, "caseStudy")
        }
        const CaseStudy = await caseStudyModel.create({ name, category, link: file, subCategory, userId })

        return res.status(200).json({
            message: "CaseStudy create success",
            status: true,
            data: CaseStudy
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const updateCaseStudy = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const obj = req.body;

        const caseStudy: any = await caseStudyModel.findById(id);

        if (!caseStudy) {
            return res.status(404).json({
                message: "CaseStudy not found",
                status: false,
                data: null
            });
        }

        Object.keys(obj).forEach(value => {
            caseStudy[value] = obj[value];
        });

        await caseStudy.save();

        return res.send({
            message: "CaseStudy updated successfully",
            status: true,
            data: caseStudy
        })
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}
export const deleteCaseStudy = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const caseStudy = await caseStudyModel.findByIdAndDelete(id);
        if (!caseStudy) {
            return res.status(404).json({
                message: "CaseStudy not found",
                status: false,
                data: null
            });
        }
        return res.status(200).json({
            message: "CaseStudy delete success",
            status: true,
            data: caseStudy
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        })
    }
}
