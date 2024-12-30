import { Request, Response } from "express";
import projectModel from "../Models/projectModel";
import mongoose, { Mongoose } from "mongoose";
import foiModel from "../Models/foiModel";
import { feasibilityStatus, projectStatus, userRoles } from "../Util/contant";
import caseStudy from "../Models/caseStudy";
import userModel from "../Models/userModel";
import { deleteFromBackblazeB2, uploadMultipleFilesBackblazeB2, uploadToBackblazeB2 } from "../Util/aws";
import summaryQuestionModel from "../Models/summaryQuestionModel";
import { mailForFeasibleTimeline, mailForNewProject } from "../Util/nodemailer";
import { addReviewQuestion } from "./summaryQuestionController";
import taskModel from "../Models/taskModel";

async function getCategoryWithUserIds() {
    try {
        const result = await caseStudy.aggregate([
            {
                $group: {
                    _id: "$category",
                    userIds: { $addToSet: "$userId" }
                }
            },
            {
                $project: {
                    category: "$_id",
                    userIds: 1,
                    _id: 0
                }
            }
        ]);

        return result;
    } catch (error) {
        throw error;
    }
}

export const createProject = async (req: any, res: Response) => {
    try {

        const { data } = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                message: "No data provided or invalid format.",
                status: false,
                data: null
            });
        }

        const insertedProjects = [];
        const skippedProjects = [];

        const casestudyData = await getCategoryWithUserIds();
        for (const project of data) {
            try {
                project.expiredData = (() => {
                    const matchedCategory = casestudyData.find(data =>
                        project.category.some((category: string) => category === data.category)
                    );

                    if (matchedCategory) {
                        return matchedCategory.userIds.map((userId: string) => ({
                            supplierId: userId,
                            date: new Date(new Date().getTime() + 48 * 60 * 60 * 1000)
                        }));
                    }
                    return [];
                })();
                project.statusHistory = [{
                    status: projectStatus.Awaiting,
                    date: new Date(),
                    userId: req.user.id,
                }]
                const newProject = await projectModel.create(project);
                insertedProjects.push(newProject);
            } catch (err: any) {
                if (err.code === 11000) {
                    skippedProjects.push({
                        project,
                        reason: 'Duplicate BOSID - Skipped'
                    });
                } else {
                    throw err;
                }
            }
        }

        if (insertedProjects.length === 0) {
            return res.status(400).json({
                message: 'No projects were added. All provided data contained duplicates.',
                status: false,
                data: null,
            });
        }

        return res.status(200).json({
            message: "Projects create success",
            status: true,
            data: insertedProjects
        });
    } catch (err: any) {
        if (err.code === 11000) {
            return res.status(500).send({
                message: 'BOSID must be unique. This value already exists.',
                status: false,
                data: null
            });
        }
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getProject = async (req: any, res: Response) => {
    try {
        const id = req.params.id;

        let project: any = await projectModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(id) }
            },
            {
                $lookup: {
                    from: 'fois',
                    localField: '_id',
                    foreignField: 'projectId',
                    as: 'fois'
                }
            },
            {
                $lookup: {
                    from: 'casestudymodels',
                    localField: 'category',
                    foreignField: 'category',
                    as: 'casestudy'
                }
            },
            {
                $lookup: {
                    from: 'mailscreenshots',
                    localField: 'BOSID',
                    foreignField: 'BOSId',
                    as: 'mailScreenshots'
                }
            },
            {
                $lookup: {
                    from: 'summaryquestions',
                    localField: '_id',
                    foreignField: 'projectId',
                    as: 'summaryQuestion'
                }
            },
            {
                $unwind: {
                    path: '$casestudy',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'casestudy.userId',
                    foreignField: '_id',
                    as: 'casestudy.userDetails'
                }
            },
            {
                $unwind: {
                    path: '$casestudy.userDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: '$_id',
                    project: { $first: '$$ROOT' },
                    casestudy: { $push: '$casestudy' }
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ['$project', { casestudy: '$casestudy' }]
                    }
                }
            },
            {
                $addFields: {
                    sortListUserIds: {
                        $ifNull: ['$sortListUserId', []]
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { sortListUserIds: '$sortListUserId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: [
                                        '$_id',
                                        {
                                            $map: {
                                                input: '$$sortListUserIds',
                                                as: 'id',
                                                in: { $toObjectId: '$$id' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'sortlistedUsers'
                }
            },
            {
                $project: {
                    'applyUserId': 0,
                    'summaryQuestion.projectId': 0,
                    'casestudy.userDetails.password': 0
                }
            }
        ]);

        if (project.length === 0) {
            return res.status(404).json({
                message: "Project not found",
                status: false,
                data: null
            })
        }
        project = project[0];

        if (project.category.length) {
            project.casestudy = await caseStudy.find({
                verify: true,
                category: { $in: project.category }
            });
        }

        if (project.select.length > 0) {
            const supplierIds = project.select.map((item: any) => item.supplierId);

            const users = await userModel.find({
                _id: { $in: supplierIds }
            });

            const updatedSelect = await Promise.all(
                project.select.map(async (item: any) => {
                    const matchedCaseStudy = await caseStudy.countDocuments({
                        userId: item.supplierId,
                        verify: true,
                        category: { $in: project.category }
                    });

                    return {
                        ...item,
                        supplierDetails: users.find(user => new mongoose.Types.ObjectId(user._id).equals(item.supplierId)),
                        matchedCaseStudy
                    };
                })
            );

            project.select = updatedSelect;
        }

        if (project.casestudy?.length > 0) {
            project.casestudy = project.casestudy.filter((casestudy: any) =>
                casestudy.userId?.toString() === req.user.id
            );
        }

        if (project.sortlistedUsers.length > 0) {
            const updatedSelect = await Promise.all(
                project.sortlistedUsers.map(async (item: any) => {
                    const matchedCaseStudy = await caseStudy.find({
                        userId: item._id,
                        verify: true,
                        category: { $in: project.category }
                    });

                    return {
                        ...item,
                        caseStudy: matchedCaseStudy
                    };
                })
            );

            project.sortlistedUsers = updatedSelect;
        }

        if (project.statusHistory.length > 0) {
            const userIds = project.statusHistory.map((item: any) => item.userId);
            const users = await userModel.find({
                _id: { $in: userIds }
            }).select("name email role mobileNumber companyName");

            const updatedStatusHistory = await Promise.all(
                project.statusHistory.map(async (item: any) => {
                    return {
                        ...item,
                        userDetails: users.find(user => new mongoose.Types.ObjectId(user._id).equals(item.userId)),
                    };
                })
            );

            project.statusHistory = updatedStatusHistory;
        }

        if (project.statusComment.length > 0) {
            const userIds = project.statusComment.map((item: any) => item.userId);
            const users = await userModel.find({
                _id: { $in: userIds }
            }).select("name email role mobileNumber companyName");

            const updatedStatusHistory = await Promise.all(
                project.statusComment.map(async (item: any) => {
                    return {
                        ...item,
                        userDetails: users.find(user => new mongoose.Types.ObjectId(user._id).equals(item.userId)),
                    };
                })
            );

            project.statusComment = updatedStatusHistory;
        }

        const tasks = await taskModel.find({ _id: id }).select("comments project")
        return res.status(200).json({
            message: "project fetch success",
            status: true,
            data: { ...project, matchedCaseStudy: project.casestudy?.length || 0 }
        });
    } catch (err: any) {
        console.log(err, "project fetch success")
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getProjectSelectUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.projectId;
        const { supplierId } = req.query

        const project = await projectModel.findById(new mongoose.Types.ObjectId(id));

        if (!project) {
            return res.status(500).json({
                message: "project not found",
                status: false,
                data: null
            });
        }

        let filteredUsers = project.select.filter(user => user.supplierId.equals(new mongoose.Types.ObjectId(supplierId as string)));
        if (filteredUsers.length < 1) {
            return res.status(404).json({
                message: "supplier user not found",
                status: false,
                data: null
            })
        }

        const user = await userModel.findById(filteredUsers[0].supplierId).select({ name: 1 });
        filteredUsers[0].supplierId = user

        return res.status(200).json({
            message: "data fetch success",
            status: true,
            data: filteredUsers[0]
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getProjects = async (req: any, res: Response) => {
    try {
        let { keyword, category, industry, projectType, foiNotUploaded, sortlist, applied, match, valueRange, website, createdDate, publishDate, status, dueDate, UKWriten, supplierId, clientType, publishDateRange, SubmissionDueDateRange, selectedSupplier, expired, supplierStatus, workInProgress, appointed, feasibilityReview, notAppointed, notAppointedToBidManager } = req.query as any
        category = category?.split(',');
        industry = industry?.split(',');
        projectType = projectType?.split(',');
        website = website?.split(',');
        status = status?.split(',');
        clientType = clientType?.split(',');
        supplierId = supplierId?.split(',');

        let filter: any = {}

        if (keyword) {
            filter = {
                $or: [
                    { BOSID: keyword },
                    { clientName: { $regex: keyword, $options: 'i' } },
                    { website: { $regex: keyword, $options: 'i' } },
                    { projectName: { $regex: keyword, $options: 'i' } },
                    { noticeReference: { $regex: keyword, $options: 'i' } }
                ]
            };
        }

        if (category) {
            filter.category = { $in: category };
        }

        if (industry) {
            filter.industry = { $in: industry };
        }

        if (projectType) {
            filter.projectType = { $in: projectType };
        }

        if (clientType) {
            filter.clientType = { $in: clientType };
        }

        if (foiNotUploaded) {
            const projectId = (await foiModel.find()).map(foi => foi.projectId)
            if (Object.keys(filter).length > 0) {
                filter = {
                    $and: [
                        filter,
                        { _id: { $nin: projectId } }
                    ]
                };
            } else {
                filter = { _id: { $nin: projectId } };
            }
        }

        if (sortlist) {
            if (req.user.role === userRoles.ProjectManager || req.user.role === userRoles.Admin || req.user.role === userRoles.ProcessManagerAdmin) {
                filter.sortListUserId = { $ne: [] }
            } else {
                filter.sortListUserId = req.user.id;
            }
        }

        if (applied) {
            filter.applyUserId = req.user.id;
        }

        let categorygroup
        if (match) {
            if (req?.user?.role === userRoles.ProjectManager) {
                categorygroup = (await caseStudy.aggregate([
                    {
                        $match: {
                            // userId: new mongoose.Types.ObjectId(req.user.id),
                            verify: true
                        }
                    },
                    {
                        $group: {
                            _id: "$category",
                            count: { $sum: 1 }
                        }
                    }
                ]))
            } else {
                categorygroup = (await caseStudy.aggregate([
                    {
                        $match: {
                            userId: new mongoose.Types.ObjectId(req.user.id),
                            verify: true
                        }
                    },
                    {
                        $group: {
                            _id: "$category",
                            count: { $sum: 1 }
                        }
                    }
                ]))
            }

            let filters: any[] = [];
            if (categorygroup.length > 0) {
                if (match === "perfect") {
                    filters = categorygroup.map(item => {
                        const category = item._id;
                        const count = item.count;
                        return {
                            $and: [
                                { category },
                                { caseStudyRequired: { $lte: count } }
                            ]
                        };
                    });
                } else if (match === "partial") {
                    filters = categorygroup.map(item => {
                        const category = item._id;
                        const count = item.count;

                        return {
                            $and: [
                                { category: category },
                                // { caseStudyRequired: { $gt: count } }
                            ]
                        };
                    });
                }

                if (Object.keys(filter).length > 0) {
                    filter = {
                        $and: [
                            filter,
                            { $or: filters }
                        ]
                    };
                } else {
                    filter = { $or: filters };
                }
            } else {
                return res.status(200).json({
                    message: "projects fetch success",
                    status: true,
                    data: {
                        data: [],
                        meta_data: {
                            page: req.pagination?.page,
                            items: 0,
                            page_size: req.pagination?.limit,
                            pages: Math.ceil(0 / (req.pagination?.limit as number))
                        }
                    }
                });
            }
        }

        if (valueRange) {
            const [startValue, endValue] = valueRange.split('-').map(Number);

            filter.minValue = { $gte: startValue };
            filter.maxValue = { $lte: endValue };
        }

        if (website) {
            filter.website = { $in: website }
        }

        if (createdDate) {
            const date = new Date(createdDate);

            const startOfDayUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
            const endOfDayUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

            filter.createdAt = { $gte: startOfDayUTC, $lte: endOfDayUTC }
        }

        if (publishDate) {
            const date = new Date(publishDate);

            const startOfDayUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
            const endOfDayUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

            filter.publishDate = { $gte: startOfDayUTC, $lte: endOfDayUTC }
        }

        if (dueDate) {
            const date = new Date(dueDate);

            const startOfDayUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
            const endOfDayUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

            filter.dueDate = { $gte: startOfDayUTC, $lte: endOfDayUTC }
        }

        if (!expired) {
            const date = new Date();
            filter.dueDate = { $gte: date }
        }

        if (publishDateRange) {
            const [startDate, endDate] = publishDateRange.split(',').map((date: string) => date.trim());

            const start = new Date(startDate);
            const end = new Date(endDate);

            const startOfDayUTC = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
            const endOfDayUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59, 999));

            filter.publishDate = { $gte: startOfDayUTC, $lte: endOfDayUTC };
        }

        if (SubmissionDueDateRange) {
            const [startDate, endDate] = SubmissionDueDateRange.split(',').map((date: string) => date.trim());

            const start = new Date(startDate);
            const end = new Date(endDate);

            const startOfDayUTC = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
            const endOfDayUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59, 999));

            filter.dueDate = { $gte: startOfDayUTC, $lte: endOfDayUTC };
        }

        if (status) {
            filter.status = { $in: status };
        }

        if (UKWriten) {
            let projectIds = await summaryQuestionModel.aggregate([
                {
                    $match: {
                        summaryQuestionFor: "UKWriter"
                    }
                },
                {
                    $group: {
                        _id: "$projectId",
                        projectIds: { $addToSet: "$projectId" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        projectIds: 1
                    }
                }
            ]);
            projectIds = projectIds.flatMap((item: any) => item.projectIds);
            projectIds = [...new Set(projectIds)];

            filter._id = { $in: projectIds }
        }

        if (supplierId) {
            filter.select = { $elemMatch: { supplierId: { $in: supplierId } } }
        }

        if (selectedSupplier) {
            filter.select = {
                $elemMatch: {
                    $exists: true,
                    $ne: null
                }
            };
        }

        if (supplierStatus) {
            const userId = req.user.id.toString();
            filter.select = {
                $elemMatch: {
                    supplierId: userId,
                    supplierStatus: supplierStatus,
                }
            };
        }
        if (workInProgress) {
            filter.select = {
                $elemMatch: {
                    supplierId: { $in: [req.user.id] },
                    supplierStatus: { $exists: true, $ne: null }
                }
            };
        }

        if (appointed) {
            filter.appointedUserId = { $elemMatch: { $eq: appointed } };
        }
        if (feasibilityReview) {
            filter.feasibilityStatus = { $ne: null };
        }
        if (notAppointed) {
            filter.$or = [
                { appointedUserId: { $exists: true, $size: 0 } },
                { appointedUserId: null }
            ];
        }
        if (notAppointedToBidManager) {
            filter.$or = [
                { appointedBidManager: { $exists: true, $size: 0 } },
                { appointedBidManager: null }
            ];
        }
        const count = await projectModel.countDocuments(filter);
        let projects: any = await projectModel.find(filter)
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ publishDate: -1 })
            .populate('sortListUserId')
        // .lean();

        if (categorygroup) {
            projects = projects.map((project: any) => {
                const totalCount = categorygroup
                    .filter((item: any) =>
                        project.category.some((categoryId: any) => categoryId === item._id)
                    )
                    .reduce((sum: number, item: any) => sum + (item.count || 0), 0);
                const result = project
                result._doc.matchedCaseStudy = totalCount || 0

                return result
            })
        }
        if (req.user?.role === userRoles.SupplierAdmin || req.user?.role === userRoles.SupplierUser) {
            projects = projects.map((project: any) => {
                const index = project.select.findIndex((item: any) =>
                    new mongoose.Types.ObjectId(item.supplierId).equals(req.user.id)
                );
                const expiredIndex = project.expiredData.findIndex((item: any) =>
                    item.supplierId.toString() === req.user.id
                );
                let isExpired = true;
                if (expiredIndex !== -1) {
                    isExpired = new Date(project.expiredData[expiredIndex].date) < new Date();
                }
                return { ...project._doc, supplierStatus: project.select[index]?.supplierStatus || null, isExpired }
            })
        }

        if (req.user?.role === userRoles.ProjectManager || req.user?.role === userRoles.FeasibilityAdmin) {
            projects = await Promise.all(
                projects.map(async (project: any) => {
                    const result = await caseStudy.aggregate([
                        { $match: { category: { $in: project.category } } },
                        { $group: { _id: "$userId" } },
                        { $group: { _id: null, distinctUserCount: { $sum: 1 } } }
                    ]);
                    project._doc.matchedSupplierCount = result.length > 0 ? result[0].distinctUserCount : 0;
                    return project;
                })
            );
        }

        projects = await Promise.all(
            projects.map(async (project: any) => {
                if (project.statusHistory.length > 0) {
                    const { userId } = project.statusHistory.at(-1);
                    const user = await userModel
                        .findById(userId)
                        .select("name email role mobileNumber companyName");
                    project._doc.statusChangeUser = user;
                } else {
                    project._doc.statusChangeUser = null;

                }
                return project;
            })
        );
        // projects = projects.map((project: any) => {
        //     const result = project.toObject ? project.toObject() : project;

        //     const dueDate = new Date(project.dueDate);

        //     result.isExpired = dueDate < new Date();

        //     return result;
        // });

        return res.status(200).json({
            message: "projects fetch success",
            status: true,
            data: {
                data: projects,
                meta_data: {
                    page: req.pagination?.page,
                    items: count,
                    page_size: req.pagination?.limit,
                    pages: Math.ceil(count / (req.pagination?.limit as number))
                }
            }
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

function areObjectsEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true; // Same reference or value

    if (typeof obj1 !== typeof obj2 || obj1 === null || obj2 === null) {
        return false; // Different types or one is null
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) return false;

        return obj1.every((item, index) => areObjectsEqual(item, obj2[index]));
    }

    if (typeof obj1 === 'object') {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return false;

        return keys1.every(key => areObjectsEqual(obj1[key], obj2[key]));
    }

    return obj1 === obj2; // Compare primitive values
}

function areArraysEqual(arr1: any[], arr2: any[]): boolean {
    // Check if lengths are the same
    if (arr1.length !== arr2.length) {
        return false;
    }

    // Check each element in the arrays
    return arr1.every((element, index) => {
        const otherElement = arr2[index];

        // Handle nested objects or arrays
        if (typeof element === "object" && typeof otherElement === "object") {
            return JSON.stringify(element) === JSON.stringify(otherElement);
        }

        // Primitive comparison
        return element === otherElement;
    });
}

export const updateProject = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const { projectName, category, industry, description, BOSID, publishDate, submission, link, periodOfContractStart, periodOfContractEnd, dueDate, bidsubmissiontime = "", projectType, website, mailID, clientType, clientName, supportingDocs, stages, noticeReference, CPVCodes, minValue, maxValue, value, status, bidsubmissionhour, bidsubmissionminute, waitingForResult, status1, BidWritingStatus, certifications, policy, eligibilityForm } = req.body

        const project: any = await projectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'project not found',
                status: false,
                data: null
            })
        }

        const fieldsToUpdate = {
            projectName, category, industry, description, BOSID, publishDate, submission, link,
            periodOfContractStart, periodOfContractEnd, dueDate, bidsubmissiontime, projectType,
            website, mailID, clientType, clientName, supportingDocs, noticeReference, CPVCodes,
            minValue, maxValue, value, status, bidsubmissionhour, bidsubmissionminute, status1,
            BidWritingStatus, eligibilityForm, waitingForResult, policy
        };

        for (const [field, newValue] of Object.entries(fieldsToUpdate)) {
            const oldValue = project[field];
            if (newValue !== undefined && newValue !== oldValue) {
                let logEntry: any = {}
                if (field === "eligibilityForm") {
                    if (areObjectsEqual(newValue, oldValue)) {
                        continue;
                    }
                    logEntry = {
                        log: `${field} was changed by <strong>${req.user?.name}</strong>`,
                        userId: req.user._id,
                        date: new Date()
                    };
                } else if (field === "category" || field === "industry") {
                    if (areArraysEqual(newValue, oldValue)) {
                        continue;
                    }
                    logEntry = {
                        log: `${field} was changed by <strong>${req.user?.name}</strong>, updated from ${oldValue} to ${newValue}`,
                        userId: req.user._id,
                        date: new Date()
                    };
                } else {
                    logEntry = {
                        log: `${field} was changed by <strong>${req.user?.name}</strong>, updated from ${oldValue} to ${newValue}`,
                        userId: req.user._id,
                        date: new Date()
                    };
                }
                project.logs = [logEntry, ...(project.logs || [])];
                // project[field] = newValue;
            }
        }
        console.log(status)
        if (project.status !== status && status !== null && status !== undefined) {
            project.statusHistory.push({
                status,
                date: new Date(),
                userId: req.user.id,
            })
        }

        project.projectName = projectName || project.projectName;
        project.category = category || project.category;
        project.industry = industry || project.industry;
        project.description = description || project.description;
        project.BOSID = BOSID || project.BOSID;
        project.publishDate = publishDate || project.publishDate;
        project.submission = submission || project.submission;
        project.link = link || project.link;
        project.periodOfContractStart = periodOfContractStart || project.periodOfContractStart;
        project.periodOfContractEnd = periodOfContractEnd || project.periodOfContractEnd;
        project.dueDate = dueDate || project.dueDate;
        project.bidsubmissiontime = bidsubmissiontime || project.bidsubmissiontime;
        project.projectType = projectType || project.projectType;
        project.website = website || project.website;
        project.mailID = mailID || project.mailID;
        project.clientType = clientType || project.clientType;
        project.clientName = clientName || project.clientName;
        project.supportingDocs = supportingDocs || project.supportingDocs;
        project.noticeReference = noticeReference || project.noticeReference;
        project.CPVCodes = CPVCodes || project.CPVCodes;
        project.minValue = minValue || project.minValue;
        project.maxValue = maxValue || project.maxValue;
        project.value = value || project.value;
        project.status = status || project.status;
        project.bidsubmissionhour = bidsubmissionhour || project.bidsubmissionhour;
        project.bidsubmissionminute = bidsubmissionminute || project.bidsubmissionminute;
        project.status1 = status1 || project.status1;
        project.BidWritingStatus = BidWritingStatus || project.BidWritingStatus;
        project.eligibilityForm = eligibilityForm || project.eligibilityForm;
        // project.policy = policy || project.policy;

        if (waitingForResult === false || waitingForResult === true) {
            project.waitingForResult = waitingForResult;
        }

        if (stages) {
            project.stages = stages.map((obj: any) => {
                return {
                    text: obj.text,
                    startDate: new Date(obj.startDate),
                    endDate: new Date(obj.endDate)
                }
            });
        }

        const updateProject = await project.save();

        return res.status(200).json({
            message: "Project update success",
            status: true,
            data: updateProject
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const project = await projectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
                status: false,
                data: null
            })
        }

        const deleteproject = await projectModel.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Project delete success",
            status: true,
            data: deleteproject
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const deleteProjectMultiple = async (req: Request, res: Response) => {
    try {
        await projectModel.deleteMany({});

        return res.status(200).json({
            message: "Projects deleted successfully",
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

export const sortList = async (req: any, res: Response) => {
    try {
        const { userId, projectId } = req.body;

        const project = await projectModel.findById(projectId);

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
                status: false,
                data: null
            })
        }

        if (!project.sortListUserId.includes(userId)) {
            project.sortListUserId = [...project.sortListUserId, userId];

            const user: any = await userModel.findById(userId);
            const logEntry = {
                log: `${user.name} was shortlisted by <strong>${req.user?.name}</strong> for the project: ${project.projectName}.`,
                userId: req.user._id,
                date: new Date()
            };
            project.logs = [logEntry, ...(project.logs || [])];
        }
        project.save();

        return res.status(200).json({
            message: "Project sortlist successfully",
            status: true
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const applyProject = async (req: any, res: Response) => {
    try {
        const { userId, projectId } = req.body;

        const project = await projectModel.findById(projectId);

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
                status: false,
                data: null
            })
        }

        if (!project.applyUserId.includes(userId)) {
            project.applyUserId = [...project.applyUserId, userId];

            const user: any = await userModel.findById(userId);
            const logEntry = {
                log: `<strong>${user.name}</strong> applied for the project: ${project.projectName}.`,
                userId: userId,
                date: new Date()
            };
            project.logs = [logEntry, ...(project.logs || [])];
        }
        project.save();

        return res.status(200).json({
            message: "Project apply successfully",
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

export const getDashboardDataSupplierAdmin = async (req: any, res: Response) => {
    try {
        const userId = req.user.id
        const user = await userModel.findById(userId)
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        const categorygroup = (await caseStudy.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.user.id),
                    verify: true
                }
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ])).reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        const categorygroupAll = (await caseStudy.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.user.id),
                    verify: true
                }
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ])).map(item => item._id)
        const date = new Date();
        const totalProjectValueAndCountMatch = await projectModel.aggregate([
            {
                $match: {
                    category: { $elemMatch: { $in: categorygroupAll } },
                    // dueDate: { $gte: date },
                    status: projectStatus.Passed
                }
            },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: "$maxValue" },
                    projectCount: { $sum: 1 }
                }
            }
        ]);
        const totalProjectValueAndCount = await projectModel.aggregate([
            // {
            //     $match: {
            //         status: projectStatus.Passed
            //     }
            // },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: "$maxValue" },
                    projectCount: { $sum: 1 }
                }
            }
        ]);
        // const totalProjectValueAndCountInCategory = await projectModel.aggregate([
        //     {
        //         $match: {
        //             category: { $elemMatch: { $in: categorygroupAll } },
        //             status: projectStatus.Passed
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: null,
        //             totalValue: { $sum: "$maxValue" },
        //             projectCount: { $sum: 1 }
        //         }
        //     }
        // ]);
        // console.log(totalProjectValueAndCountInCategory, "totalProjectValueAndCountInCategory")
        const result = totalProjectValueAndCount[0] || { totalValue: 0, projectCount: 0 };
        const result1 = totalProjectValueAndCountMatch[0] || { totalValue: 0, projectCount: 0 };
        const result2 = totalProjectValueAndCountMatch[0] || { totalValue: 0, projectCount: 0 };

        // const projects = await projectModel.find({ category: { $in: categorygroupAll }, status: "Passed" })
        const projects = await projectModel.find({ status: "Passed" })
        const responseData = {
            projectCount: {
                totalProjects: result.projectCount,
                totalProjectInCategory: result2.projectCount,
                matchedProjects: result1.projectCount,
                totalSubmit: 0,
                totalAwarded: 0,
                totalNotAwarded: 0,
                totalInSubmition: 0,
                totalInSolution: 0,
                totalInReview: 0,
                totalExpired: 0,
                totalpassed: 0,
                //nre
                sortListed: 0,
                drop: 0,
                UKExpertWritingsCount: 0,
                UKExpertReviewCount: 0
            },
            projectValue: {
                totalProjectValue: result.totalValue,
                ProjectInCategoryValue: result2.totalValue,
                matchedProjectsValue: result1.totalValue,
                totalSubmitValue: 0,
                totalAwardedValue: 0,
                totalNotAwardedValue: 0,
                totalpassedValue: 0,
                //new 
                sortListedValue: 0,
                dropValue: 0,
                insolutionValue: 0,
                inReviewValue: 0,
                inSubmitionsValue: 0,
                UKExpertWritingsValue: 0,
                UKExpertReviewValue: 0
            }
        }
        projects.forEach((project: any) => {
            // responseData.projectValue.ProjectInCategoryValue += project.maxValue;
            // if (Object.keys(categorygroup).includes(project.category)) {
            //     responseData.projectCount.totalProjectInCategory
            // }
            // if (Object.keys(categorygroupAll).includes(project.category)) {
            //     console.log(0 <= categorygroupAll[project.category])
            //     if (0 <= categorygroupAll[project.category]) {
            //         responseData.projectCount.matchedProjects++;
            //         responseData.projectValue.matchedProjectsValue += project.maxValue;
            //     }
            // }
            if (project.status === projectStatus.Submitted) {
                responseData.projectCount.totalSubmit++;
                responseData.projectValue.totalSubmitValue += project.maxValue;
            }

            if (project.status === projectStatus.Awarded) {
                responseData.projectCount.totalAwarded++;
                responseData.projectValue.totalAwardedValue += project.maxValue;
            }
            if (project.status === projectStatus.NotAwarded) {
                responseData.projectCount.totalNotAwarded++;
                responseData.projectValue.totalNotAwardedValue += project.maxValue;
            }
            if (project.status === projectStatus.Passed) {
                responseData.projectCount.totalpassed++;
                responseData.projectValue.totalpassedValue += project.maxValue;
            }
            if (project.status === projectStatus.InSubmission) {
                responseData.projectCount.totalInSubmition++;
                responseData.projectValue.inSubmitionsValue += project.maxValue;
            }
            if (project.status === projectStatus.InSolution) {
                responseData.projectCount.totalInSolution++;
                responseData.projectValue.insolutionValue += project.maxValue;

            }
            if (project.status === projectStatus.InReviewWestGate) {
                responseData.projectCount.totalInReview++;
                responseData.projectValue.inReviewValue += project.maxValue;
            }
            if (project.sortListUserId.some((id: any) => id.equals(new mongoose.Types.ObjectId(userId)))) {
                responseData.projectCount.sortListed++;
                responseData.projectValue.sortListedValue += project.maxValue;
            }
            if (project.dropUser.includes(new mongoose.Types.ObjectId(userId))) {
                responseData.projectCount.drop++;
                responseData.projectValue.dropValue += project.maxValue;
            }
        })
        return res.status(200).json({
            message: "Dashboard data fetch success",
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

export const getDashboardDataProjectManager = async (req: any, res: Response) => {
    try {
        const userId = req.user.id

        const user = await userModel.findById(userId)

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        const projects = await projectModel.find({ category: { $in: user?.categoryList } })
        const responseData = {
            totalProjectsMatched: projects.length,
            totalProjectsFinalized: 0,
        }

        projects.forEach(project => {
            const userId = new mongoose.Types.ObjectId(req.user.id);
            if (project?.finalizedById?.equals(userId)) {
                responseData.totalProjectsFinalized++;
            }

        })
        return res.status(200).json({
            message: "Dashboard data fetch success",
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

export const updateProjectForFeasibility = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const { category, industry, bidsubmissiontime = "", clientDocument, status, statusComment, failStatusImage, subContracting, subContractingfile, economicalPartnershipQueryFile, economicalPartnershipResponceFile, FeasibilityOtherDocuments, loginDetail, caseStudyRequired, certifications, policy, failStatusReason, value, bidsubmissionhour, bidsubmissionminute, waitingForResult, comment, projectComment, status1, BidWritingStatus, eligibilityForm } = req.body

        const project: any = await projectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'project not found',
                status: false,
                data: null
            })
        }

        const fieldsToUpdate = {
            category, industry, clientDocument, status, statusComment, failStatusImage, subContracting, subContractingfile, economicalPartnershipQueryFile, economicalPartnershipResponceFile, FeasibilityOtherDocuments, loginDetail, caseStudyRequired, policy, failStatusReason, value, bidsubmissionhour, bidsubmissionminute, waitingForResult, comment, projectComment, status1, BidWritingStatus, eligibilityForm
        };

        for (const [field, newValue] of Object.entries(fieldsToUpdate)) {
            const oldValue = project[field];
            if (newValue !== undefined && newValue !== oldValue) {
                let logEntry: any = {}
                if (field === "statusComment" || field === "clientDocument" || field === "FeasibilityOtherDocuments") {
                    if (areArraysEqual(newValue, oldValue)) {
                        continue;
                    }
                    logEntry = {
                        log: `${field} was changed by <strong>${req.user?.name}</strong>`,
                        userId: req.user._id,
                        date: new Date()
                    };
                } else if (field === "failStatusImage" || field === "subContractingfile" || field === "economicalPartnershipQueryFile" || field === "economicalPartnershipQueryFile" || field === "economicalPartnershipResponceFile") {
                    if (areObjectsEqual(newValue, oldValue)) {
                        continue;
                    }
                    logEntry = {
                        log: `${field} was changed by <strong>${req.user?.name}</strong>`,
                        userId: req.user._id,
                        date: new Date()
                    };
                } else if (field === "loginDetail" || field === "eligibilityForm" || field === "projectComment") {
                    if (areArraysEqual(newValue, oldValue)) {
                        continue;
                    }
                    logEntry = {
                        log: `${field} was changed by <strong>${req.user?.name}</strong>`,
                        userId: req.user._id,
                        date: new Date()
                    };
                } else if (field === "failStatusReason") {
                    if (areArraysEqual(newValue, oldValue)) {
                        continue;
                    }
                    logEntry = {
                        log: `${field} was changed by <strong>${req.user?.name}</strong>, updated from ${oldValue} to ${newValue}`,
                        userId: req.user._id,
                        date: new Date()
                    };
                }
                else {
                    logEntry = {
                        log: `${field} was changed by <strong>${req.user?.name}</strong>, updated from ${oldValue} to ${newValue}`,
                        userId: req.user._id,
                        date: new Date()
                    };
                }
                project.logs = [logEntry, ...(project.logs || [])];
            }
        }

        console.log("project", status)
        if (project.status !== status && status !== null && status !== undefined) {
            if (req.user.role === userRoles.FeasibilityUser) {
                project.feasibilityStatus = feasibilityStatus.feasibilityStatusChange;
            }
            project.statusHistory.push({
                status,
                date: new Date(),
                userId: req.user.id,
            })
        }
        project.category = category || project.category;
        project.industry = industry || project.industry;
        project.bidsubmissiontime = bidsubmissiontime || project.bidsubmissiontime;
        project.clientDocument = clientDocument || project.clientDocument;
        project.status = status || project.status;
        project.statusComment = statusComment || project.statusComment;
        project.failStatusImage = failStatusImage || project.failStatusImage;
        project.subContractingfile = subContractingfile || project.subContractingfile;
        project.economicalPartnershipQueryFile = economicalPartnershipQueryFile || project.economicalPartnershipQueryFile;
        project.economicalPartnershipResponceFile = economicalPartnershipResponceFile || project.economicalPartnershipResponceFile;
        project.FeasibilityOtherDocuments = FeasibilityOtherDocuments || project.FeasibilityOtherDocuments;
        project.loginDetail = loginDetail || project.loginDetail;
        project.caseStudyRequired = caseStudyRequired || project.caseStudyRequired;
        // project.certifications = certifications || project.certifications;
        project.eligibilityForm = eligibilityForm || project.eligibilityForm;
        project.failStatusReason = failStatusReason || project.failStatusReason;
        project.value = value || project.value;
        project.bidsubmissionhour = bidsubmissionhour || project.bidsubmissionhour;
        project.bidsubmissionminute = bidsubmissionminute || project.bidsubmissionminute;
        project.comment = comment || project.comment;
        project.projectComment = projectComment || project.projectComment;
        project.status1 = status1 || project.status1;
        project.BidWritingStatus = BidWritingStatus || project.BidWritingStatus;

        if (subContracting === false || subContracting === true) {
            project.subContracting = subContracting;
        }

        const updateProject = await project.save();

        return res.status(200).json({
            message: "Project update success",
            status: true,
            data: updateProject
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
        let file
        if (req.files?.length === 1) {
            file = await uploadToBackblazeB2(req.files[0], "files")
        } else if (req.files?.length > 1) {
            file = await uploadMultipleFilesBackblazeB2(req.files, "files")
        }

        return res.status(200).json({
            message: "file uploaded successfully",
            status: true,
            data: file
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const deleteFiles = async (req: Request, res: Response) => {
    try {

        let { files } = req.body

        files.forEach(async (file: { key: string }) => {
            await deleteFromBackblazeB2(file)
        });
        // files = await deleteMultipleFromS3(files.map((file: { key: string }) => file.key))
        return res.status(200).json({
            message: "file deleted successfully",
            status: true,
            // data: files
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getSupplierAdminList = async (req: any, res: Response) => {
    try {

        const projectId = req.params.projectId;
        const { supplierId } = req.query;

        const project = await projectModel.findById(projectId, { category: 1, caseStudyRequired: 1 });

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
                status: false,
                data: null
            });
        }

        const groupedData = await caseStudy.aggregate([
            {
                $match: {
                    category: { $in: project.category }
                }
            },
            { $group: { _id: "$userId", caseStudies: { $push: "$$ROOT" } } }
        ]);

        let userIds: any = []
        groupedData.forEach(user => {
            if (user.caseStudies.length > project.caseStudyRequired) {
                userIds.push(user._id);
            }
        })
        if (supplierId) {
            const supplierObjectId = new mongoose.Types.ObjectId(supplierId);

            if (userIds.some((id: any) => new mongoose.Types.ObjectId(id)?.equals(supplierObjectId))) {
                userIds = [supplierObjectId];
            } else {
                userIds = [];
            }
        }
        let users = await userModel.find({ _id: { $in: userIds } }).select({ password: 0 });

        users = users.map((user: any) => {
            return { ...user._doc, caseStudy: (groupedData.find(c => user._id.equals(c._id))).caseStudies }
        })

        return res.status(200).json({
            message: "projects fetch success",
            status: true,
            data: users
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const updateProjectForProjectManager = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const { select, finalizedId, dropUser } = req.body

        const project = await projectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'project not found',
                status: false,
                data: null
            })
        }
        if (select) {
            let { supplierId, companySelect, handoverCall } = select
            if (!supplierId || !companySelect || !handoverCall) {
                return res.status(401).json({
                    message: "All field required",
                    status: true,
                    data: null
                });
            }

            supplierId = new mongoose.Types.ObjectId(supplierId)
            if (!(project.select.some((select: any) => new mongoose.Types.ObjectId(select.supplierId)?.equals(supplierId)))) {
                project.select.push(select);

                const user: any = await userModel.findById(supplierId);
                const logEntry = {
                    log: `<strong>${user.name}</strong> is select for the project.`,
                    userId: supplierId,
                    date: new Date()
                };
                project.logs = [logEntry, ...(project.logs || [])];
            }
        }
        if (finalizedId) {
            project.finalizedId = finalizedId
            project.finalizedById = req.user.id
            // project.finalized = {
            //     finalizedId,

            // }
            const user: any = await userModel.findById(finalizedId);
            const logEntry = {
                log: `<strong>${user.name}<strong> Won the project.`,
                userId: finalizedId,
                date: new Date()
            };
            project.logs = [logEntry, ...(project.logs || [])];

            project.status = projectStatus.Won
            project.closedDate = new Date()
        }
        if (dropUser) {
            let { userId, reason } = dropUser
            userId = new mongoose.Types.ObjectId(userId)
            if (!(project.dropUser.some((dropUser: any) => dropUser.userId.equals(userId)))) {
                project.dropUser.push({ userId, reason });

                const user: any = await userModel.findById(userId);
                const logEntry = {
                    log: `<strong>${user.name}</strong> is drop by ${req.user.name}`,
                    userId: userId,
                    date: new Date()
                };
                project.logs = [logEntry, ...(project.logs || [])];
            }
        }

        const updateProject = await project.save();

        return res.status(200).json({
            message: "Project update success",
            status: true,
            data: updateProject
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getDashboardDataUKWriter = async (req: any, res: Response) => {
    try {

        let projectIds = await summaryQuestionModel.aggregate([
            {
                $match: {
                    summaryQuestionFor: "UKWriter"
                }
            },
            {
                $group: {
                    _id: "$projectId",
                    projectIds: { $addToSet: "$projectId" }
                }
            },
            {
                $project: {
                    _id: 0,
                    projectIds: 1
                }
            }
        ]);
        projectIds = projectIds.flatMap((item: any) => item.projectIds);
        projectIds = [...new Set(projectIds)];

        const projects = await projectModel.find({ _id: { $in: projectIds } })
        const responseData = {
            totalProjectsReviewed: projects.length,
        }

        return res.status(200).json({
            message: "Dashboard data fetch success",
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

export const getSelectedUserDataUKWriter = async (req: any, res: Response) => {
    try {
        const projectId = req.params.id;
        const { search } = req.query;

        const project = await projectModel.findById(projectId);

        if (!project) {
            return res.status(40).json({
                message: "Project not found",
                status: false,
                data: null
            })
        }

        let userData: any[] = [];

        for (const pro of project?.select) {
            const user = await userModel.findById(pro.supplierId).select({ password: 0, avatar: 0 });
            userData.push({ ...pro, supplierId: user });
        }

        if (search) {
            userData = userData.filter(user => {
                if (user?.supplierId?._id.toString() === search || user?.supplierId?.name?.includes(search)) {
                    return true;
                } else {
                    return false;
                }
            });
        }
        return res.status(200).json({
            message: "user data fetch success",
            status: true,
            data: userData
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getDashboardDataProjectCoOrdinator = async (req: any, res: Response) => {
    try {
        const projects = await projectModel.countDocuments({ status: projectStatus.Won })


        const responseData = {
            totalProjects: projects,
        }

        return res.status(200).json({
            message: "Dashboard data fetch success",
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

export const getLatestProject = async (req: any, res: Response) => {
    try {
        const projects = await projectModel.find().sort({ createdAt: -1 }).limit(10)

        return res.status(200).json({
            message: "project fetch success",
            status: true,
            data: projects
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const addProjectStatusForSupplier = async (req: any, res: Response) => {
    try {
        const { projectId, supplierId, supplierStatus } = req.body

        const project = await projectModel.findById(projectId);

        if (!project) {
            return res.status(404).json({
                message: 'project not found',
                status: false,
                data: null
            })
        }
        project.select = project.select.map(select => {
            if (select.supplierId === supplierId) {
                return {
                    ...select,
                    supplierStatus
                }
            } else {
                return select
            }
        })

        const updateProject = await project.save();
        return res.status(200).json({
            message: "status add project successfully",
            status: true,
            data: updateProject
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const mailSend = async (req: Request, res: Response) => {
    try {
        const { projectName, BOSID } = req.body

        if (!projectName && !BOSID) {
            return res.status(200).json({
                message: "Please pass a project name and a BOSID",
                status: false,
                data: null
            });
        }

        mailForFeasibleTimeline(process.env.MAILSEND_EMAIL as string, req.body).then(data => console.log(data)).catch(err => console.log(err));

        return res.status(200).json({
            message: "Mail send success",
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

export const newProjectAddMail = async (req: Request, res: Response) => {
    try {
        const { SupplierName } = req.body

        if (SupplierName) {
            return res.status(200).json({
                message: "Please pass Supplier Name",
                status: false,
                data: null
            });
        }

        const recivermail = [
            {
                email: 'arjun@runtime-solutions.com',
                supplierName: "Runtime Solutions"
            },
            {
                email: 'anand.jha@nileegames.com',
                supplierName: "Nilee Games and Future Technologiees Pvt. Ltd"
            },
            {
                email: 'adarsh@softprolang.com',
                supplierName: "SoftProlong - Software Development Company"
            },
            {
                email: 'pratik@thecybertechsolution.com',
                supplierName: "Cyber Tech Solutions"
            },
            {
                email: 'hello@someshwara.com/ basavaraj@someshwara.com',
                supplierName: "Someshwara Software"
            },
            {
                email: 'aashutosh@androidblaze.in',
                supplierName: "ASAG Androapps Technology Pvt. Ltd."
            },
            {
                email: 'collinitsolution@gmail.com',
                supplierName: "Collin It Solution"
            },
            {
                email: 'pshrotriya@splendornet.com',
                supplierName: "SplendorNet"
            },
            {
                email: 'tanmay.samal@alptechsoftware.com',
                supplierName: "Alptech Software Solutions LLP"
            },
            {
                email: 'hr@svapps.in',
                supplierName: "SVAPPS SOFT SOLUTIONS PVT. LTD."
            },
            {
                email: 'info@emergeflow.com',
                supplierName: "EmergeFlow Technologies"
            },
            {
                email: 'vidyadhari@compileinfy.com',
                supplierName: "Compileinfy Technology Solutions LLP"
            },
            {
                email: 'baskarraj@Multimise.com',
                supplierName: "Multimise (MITS)"
            },
            {
                email: 'letstalk@jscreationsnent.com',
                supplierName: "JS CREATIONS AND ENTERTAINMENT"
            },
            {
                email: 'shubham@thefinansol.com',
                supplierName: "Infinevo Tech Pvt. Ltd. (TheFinansol)"
            },
            {
                email: 'info@Posistrength.com',
                supplierName: "Posistrength Software Solution Pvt.Ltd."
            },
            {
                email: 'varun@khoslatech.com',
                supplierName: "khosla tech"
            },
            {
                email: 'mukhtar@ssmaktak.com',
                supplierName: "SSMAK"
            },
            {
                email: 'sudhir@openlx.com',
                supplierName: "OpenLX(reminder at eve)"
            }
        ]

        // const recivermail = [
        //     {
        //         email: 'jeel.tadhani11@gmail.com',
        //         supplierName: "Jeel Tadhani"
        //     },
        //     {
        //         email: 'jeeltadhani2003@gmail.com',
        //         supplierName: "jeel patel"
        //     }
        // ]
        for (const data of recivermail) {
            await mailForNewProject(data.email, data)
                .then(() => console.log(`Mail sent successfully to ${data.email}`))
                .catch(err => console.error(`Error sending mail to ${data.email}:`, err));
        }

        return res.status(200).json({
            message: "Mails send successfully",
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

export const getProjectCountAndValueBasedOnStatus = async (req: any, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        let createdAtFilter = {};

        if (startDate && endDate) {
            createdAtFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const projects = await projectModel.find(createdAtFilter).select({ status: 1, maxValue: 1, category: 1, sortListUserId: 1 });
        let data: any = {
            FeasibilityStatusCount: {
                "Passed": 0,
                "Fail": 0,
                "Awaiting": 0,
                "InProgress": 0,
                "DocumentsNotFound": 0
            },
            FeasibilityStatusValue: {
                "Passed": 0,
                "Fail": 0,
                "Awaiting": 0,
                "InProgress": 0,
                "DocumentsNotFound": 0
            },
            BidStatusCount: {
                "Shortlisted": 0,
                "DroppedAfterFeasibility": 0,
                "InSolution": 0,
                "WaitingForResult": 0,
                "Awarded": 0,
                "NotAwarded": 0,
            },
            BidStatusValue: {
                "Shortlisted": 0,
                "DroppedAfterFeasibility": 0,
                "InSolution": 0,
                "WaitingForResult": 0,
                "Awarded": 0,
                "NotAwarded": 0,
            },
        };

        projects.forEach((project: any) => {

            if (data.FeasibilityStatusCount[project.status] >= 0) {
                data.FeasibilityStatusCount[project.status]++;
                data.FeasibilityStatusValue[project.status] += project.maxValue;
            } else if (data.BidStatusCount[project.status] >= 0) {
                data.BidStatusCount[project.status]++;
                data.BidStatusValue[project.status] += project.maxValue;
            } else {
                // for future all status count add from this section
            }

            if (project.sortListUserId.length > 0) {
                data.BidStatusCount['Shortlisted']++
                data.BidStatusValue.Shortlisted += project.maxValue
            }

        })

        return res.status(200).json({
            message: "data fetch success",
            status: true,
            data: data
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const appointUserToProject = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const { userId } = req.body;

        if (!Array.isArray(userId) || userId.length === 0) {
            return res.status(400).json({
                message: "Invalid input: userId must be a non-empty array",
                status: false,
                data: null,
            });
        }


        const project = await projectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                status: false,
                data: null,
            });
        }

        const newUserIds = userId.filter((userId: string) =>
            !project.appointedUserId.some((appointedId: mongoose.Types.ObjectId) =>
                appointedId.equals(new mongoose.Types.ObjectId(userId))
            )
        );


        if (newUserIds.length > 0) {
            project.appointedUserId.push(...newUserIds);

            const updatedProject = await project.save();

            return res.status(200).json({
                message: "Users appointed successfully",
                status: true,
                data: updatedProject,
            });
        } else {
            return res.status(400).json({
                message: "All provided users are already appointed to this project",
                status: false,
                data: null,
            });
        }
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null,
        });
    }
};

export const appointBidManagerToProject = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                message: "Invalid input: userIds must be a non-empty array",
                status: false,
                data: null,
            });
        }

        const project = await projectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                status: false,
                data: null,
            });
        }

        const newUserIds = userIds.filter((userId: string) =>
            !project.appointedBidManager.some((appointedId: mongoose.Types.ObjectId) =>
                appointedId.equals(new mongoose.Types.ObjectId(userId))
            )
        );


        if (newUserIds.length > 0) {
            project.appointedBidManager.push(...newUserIds);

            const updatedProject = await project.save();

            return res.status(200).json({
                message: "BID-Managers appointed successfully",
                status: true,
                data: updatedProject,
            });
        } else {
            return res.status(400).json({
                message: "All provided BID-Managers are already appointed to this project",
                status: false,
                data: null,
            });
        }
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null,
        });
    }
};

export const approveOrRejectFeasibilityStatus = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const { action } = req.body

        const project: any = await projectModel.findById(id);
        if (!project) {
            return res.status(404).json({
                message: 'project not found',
                status: false,
                data: null
            })
        }
        if (action === feasibilityStatus.approve) {
            project.feasibilityStatus = null;
        } else {
            project.feasibilityStatus = null;
            project.status = projectStatus.Inprogress;
        }

        const updateProject = await project.save();

        return res.status(200).json({
            message: "Project update success",
            status: true,
            data: updateProject
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getProjectLogs = async (req: any, res: Response) => {
    try {
        const projectId = req.params.id;

        const project: any = await projectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({
                message: 'project not found',
                status: false,
                data: null
            })
        }

        let logs: any = [];
        if (req.user.role === userRoles.Admin || req.user.role === userRoles.ProcessManagerAdmin || req.user.role === userRoles.FeasibilityAdmin) {
            logs = project.logs;
        } else if (req.user.role === userRoles.FeasibilityUser) {
            const isUserAppointed = project.appointedUserId.some((userId: any) => userId.equals(req.user._id));
            if (isUserAppointed) {
                logs = project.logs;
            }
        } else if (req.user.role === userRoles.ProjectManager) {
            const isUserAppointed = project.appointedBidManager.some((userId: any) => userId.equals(req.user._id));

            if (isUserAppointed) {
                logs = project.logs;
            }
        }

        return res.status(200).json({
            message: "Project Logs fatch successfully",
            status: true,
            data: logs
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}