import { Request, Response } from "express"
import caseStudyModel from "../Models/caseStudy"
import { uploadToBackblazeB2 } from "../Util/aws"
import projectModel from "../Models/projectModel";
import userModel from "../Models/userModel";
import mongoose from "mongoose";

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
        const { userId } = req.query as { userId?: string };
        let { category, search, activeOnly } = req.query as { category?: string; search?: string; activeOnly?: string };

        const limit = Number(req.pagination?.limit) || 10;
        const skip = Number(req.pagination?.skip) || 0;
        const page = Number(req.pagination?.page) || 1;

        const match: any = {};

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            match.userId = new mongoose.Types.ObjectId(userId);
        }

        const categories = typeof category === "string"
            ? category.split(",").map(s => s.trim()).filter(Boolean)
            : [];

        if (categories.length) {
            match.category = { $in: categories };
        }

       const shouldFilterActiveOnly = activeOnly === 'true';

        // pipeline
        const pipeline: any[] = [
            { $match: match },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$userId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                        // Only filter by active status if activeOnly is true
                        ...(shouldFilterActiveOnly ? [{ $match: { active: true } }] : []),
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                role: 1,
                                companyName: 1,
                                active: 1
                            }
                        }
                    ],
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } }

        ];

        if (search && String(search).trim() !== "") {
            const rx = new RegExp(String(search).trim(), "i");
            pipeline.push({
                $match: {
                    $or: [
                        { name: rx },
                        { "user.companyName": rx }
                    ]
                }
            });
        }

        pipeline.push(
            { $sort: { createdAt: -1, _id: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                resourcesUsed: 1,
                                contractValue: 1,
                                maintenance: 1,
                                contractDuration: 1,
                                technologies: 1,
                                description: 1,
                                type: 1,
                                industry: 1,
                                date: 1,
                                verify: 1,
                                subCategory: 1,
                                cost: 1,
                                lessonsLearned: 1,
                                resultAchieved: 1,
                                solutionProvided: 1,
                                problem: 1,
                                link: 1,
                                clientName: 1,
                                category: 1,
                                createdAt: 1,
                                userId: {
                                    _id: "$user._id",
                                    name: "$user.name",
                                    role: "$user.role",
                                    companyName: "$user.companyName",
                                    active: "$user.active"
                                }
                            }
                        }
                    ],
                    meta: [{ $count: "total" }]
                }
            }
        );

        const aggResult = await caseStudyModel.aggregate(pipeline);
        const data = aggResult[0]?.data || [];
        const total = aggResult[0]?.meta?.[0]?.total || 0;

        return res.status(200).json({
            message: "CaseStudy successfully fetched",
            status: true,
            data: {
                data,
                meta_data: {
                    page,
                    items: total,
                    page_size: limit,
                    pages: Math.ceil(total / limit)
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
};

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
            const supplier = await userModel.findById(caseStudy.userId);
        
            if (supplier?.subcontractingSupplier) {
                await userModel.findByIdAndUpdate(caseStudy.userId, {
                    active: false,
                    isInHold: false
                });
            }
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
