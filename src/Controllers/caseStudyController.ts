import { Request, Response } from "express"
import caseStudyModel from "../Models/caseStudy"
import { uploadToBackblazeB2 } from "../Util/aws"
import projectModel from "../Models/projectModel";
import userModel from "../Models/userModel";

async function handleProjectUpdate(category: string, userId: string) {
    try {
        const filter: any = {
            category: { $in: [category] },
            dueDate: { $gte: new Date() },
            expiredData: {
                $not: {
                    $elemMatch: { supplierId: userId }
                }
            }
        }
        const expiredDataObject = {
            supplierId: userId,
            date: new Date(new Date().getTime() + 48 * 60 * 60 * 1000)
        };

        const update = {
            $push: { expiredData: expiredDataObject }
        };

        const result = await projectModel.updateMany(filter, update);
        return {
            message: "Projects updated successfully",
            modifiedCount: result.modifiedCount
        };
    } catch (error) {
        throw error;
    }
}

export const caseStudyList = async (req: any, res: Response) => {
    try {
        const userId = req.query?.userId || req.user.id
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
            .sort({ createdAt: -1, _id: -1 });

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

const updateSupplierStatus = async (userId: any, isInHold: boolean, active: boolean) => {
    await userModel.updateOne(
        { _id: userId },
        { $set: { isInHold, active } }
    );
};

export const createCaseStudy = async (req: any, res: Response) => {
    try {
        let { file } = req.body
        const userId = req.body?.userId || req.user.id

        if (req.file) {
            file = await uploadToBackblazeB2(req.file, "caseStudy")
        }
        const existingCaseStudy = await caseStudyModel.find({ userId, category: req.body?.category })
        const CaseStudy = await caseStudyModel.create({ ...req.body, userId, link: file })

        if (!existingCaseStudy.length) {
            const result = await handleProjectUpdate(req.body.category, userId)

            await updateSupplierStatus(userId, true, true); 

        }
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

export const createCaseStudyMultiple = async (req: Request, res: Response) => {
    try {

        const { data } = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                message: "No data provided or invalid format.",
                status: false,
                data: null
            });
        }

        const userId = data[0].userId;

        const categories = [...new Set(data.map((item: any) => item.category))];
        const existingCaseStudies = await caseStudyModel.find({
            userId,
            category: { $in: categories }
        });

        const existingCategories = new Set(existingCaseStudies.map(cs => cs.category));
        const newCategories = categories.filter(category => !existingCategories.has(category));

        for (const category of newCategories) {
            await handleProjectUpdate(category, userId);
        }

        const saveData = await caseStudyModel.insertMany(data);

        const remainingCaseStudies = await caseStudyModel.find({ userId });

        if (remainingCaseStudies.length === data.length) {
            await updateSupplierStatus(userId, true, true);
        }

        return res.status(200).json({
            message: "CaseStudy create success",
            status: true,
            data: saveData
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
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

        const remainingCaseStudies = await caseStudyModel.find({ userId: caseStudy.userId });
        
        if (remainingCaseStudies.length === 0) {
            await updateSupplierStatus(caseStudy.userId, false, true);
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
