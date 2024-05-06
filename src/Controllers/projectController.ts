import { Request, Response } from "express";
import projectModel from "../Models/projectModel";
import mongoose from "mongoose";
import foiModel from "../Models/foiModel";
import { projectStatus } from "../Util/contant";
import caseStudy from "../Models/caseStudy";
import userModel from "../Models/userModel";
import { deleteFromS3, uploadMultipleFilesToS3, uploadToS3 } from "../Util/aws";
import summaryQuestionModel from "../Models/summaryQuestionModel";


export const createProject = async (req: Request, res: Response) => {
    try {

        const { data } = req.body;

        const newProjects = await projectModel.insertMany(data)

        return res.status(200).json({
            message: "Projects create success",
            status: true,
            data: newProjects
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getProject = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const project = await projectModel.aggregate([
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
                    as: 'summaryQuestion',
                }
            },
            {
                $project: {
                    applyUserId: 0,
                    sortListUserId: 0,
                    'summaryQuestion.projectId': 0
                }
            }
        ]);

        return res.status(200).json({
            message: "project fetch success",
            status: true,
            data: project[0]
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
        let { keyword, category, industry, projectType, foiNotUploaded, sortlist, applied, match, valueRange, website, createdDate, publishDate, status, dueDate, UKWriten } = req.query as any
        category = category?.split(',');
        industry = industry?.split(',');
        projectType = projectType?.split(',');
        website = website?.split(',');
        status = status?.split(',');

        let filter: any = {}

        if (keyword) {
            filter = {
                $or: [
                    { BOSID: keyword },
                    { projectName: { $regex: keyword, $options: 'i' } }
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
            filter.sortListUserId = req.user.id;
        }

        if (applied) {
            filter.applyUserId = req.user.id;
        }

        let categorygroup
        if (match) {
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


            let filters: any[] = [];
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
                            { caseStudyRequired: { $gt: count } }
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
        }

        if (valueRange) {
            const [startValue, endValue] = valueRange.split('-');

            filter.value = { $gte: startValue, $lte: endValue };
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
            console.log(projectIds)
        }
        const count = await projectModel.countDocuments(filter);
        let projects = await projectModel.find(filter)
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1 });

        if (categorygroup) {
            projects = projects.map((project: any) => {
                const data = categorygroup.find((item: any) => item._id === project.category)
                if (data) {
                    const result = project
                    result._doc.matchedCaseStudy = data.count

                    return result
                } else {
                    return project
                }
            })
        }

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
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const updateProject = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { projectName, category, industry, description, BOSID, publishDate, submission, link, periodOfContractStart, periodOfContractEnd, dueDate, value, projectType, website, mailID, clientType, clientName } = req.body

        const project = await projectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'project not found',
                status: false,
                data: null
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
        project.value = value || project.value;
        project.projectType = projectType || project.projectType;
        project.website = website || project.website;
        project.mailID = mailID || project.mailID;
        project.clientType = clientType || project.clientType;
        project.clientName = clientName || project.clientName;

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
            message: "User delete success",
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

export const sortList = async (req: Request, res: Response) => {
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

export const applyProject = async (req: Request, res: Response) => {
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

        const totalProjectValue = await projectModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: "$value" }
                }
            }
        ]);

        const projects = await projectModel.find({ category: { $in: user?.categoryList } })
        const responseData = {
            totalProjects: projects.length,
            matchedProjects: 0,
            totalSubmit: 0,
            totalAwarded: 0,
            totalNotAwarded: 0,
            totalInSubmition: 0,
            totalInSolution: 0,
            totalInReview: 0,
            totalExpired: 0,
            totalProjectValue: totalProjectValue[0].totalValue,
            matchedProjectsValue: 0,
            totalSubmitValue: 0,
            totalAwardedValue: 0,
            totalNotAwardedValue: 0,
        }

        projects.forEach(project => {
            if (Object.keys(categorygroup).includes(project.category)) {
                if (project.caseStudyRequired <= categorygroup[project.category]) {
                    responseData.matchedProjects++;
                    responseData.matchedProjectsValue += project.value;
                }
            }
            if (project.status === projectStatus.Submitted) {
                responseData.totalSubmit++;
                responseData.totalSubmitValue += project.value;
            }

            if (project.status === projectStatus.Awarded) {
                responseData.totalAwarded++;
                responseData.totalAwardedValue += project.value;
            }
            if (project.status === projectStatus.NotAwarded) {
                responseData.totalNotAwarded++;
                responseData.totalNotAwardedValue += project.value;
            }
            if (project.status === projectStatus.InSubmition) {
                responseData.totalInSubmition++;
            }
            if (project.status === projectStatus.InSolution) {
                responseData.totalInSolution++;
            }
            if (project.status === projectStatus.InReview) {
                responseData.totalInReview++;
            }
            if (project.status === projectStatus.Expired) {
                responseData.totalExpired++;
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

export const updateProjectForFeasibility = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { category, industry, value, clientDocument, status, statusComment, failStatusImage, subContracting, subContractingfile, economicalPartnershipQueryFile, economicalPartnershipResponceFile, FeasibilityOtherDocuments, loginDetail, caseStudyRequired, certifications, policy, failStatusReason } = req.body

        const project = await projectModel.findById(id);

        if (!project) {
            return res.status(404).json({
                message: 'project not found',
                status: false,
                data: null
            })
        }
        project.category = category || project.category;
        project.industry = industry || project.industry;
        project.value = value || project.value;
        project.clientDocument = clientDocument || project.clientDocument;
        project.status = status || project.status;
        project.statusComment = statusComment || project.statusComment;
        project.failStatusImage = failStatusImage || project.failStatusImage;
        project.subContracting = subContracting || project.subContracting;
        project.subContractingfile = subContractingfile || project.subContractingfile;
        project.economicalPartnershipQueryFile = economicalPartnershipQueryFile || project.economicalPartnershipQueryFile;
        project.economicalPartnershipResponceFile = economicalPartnershipResponceFile || project.economicalPartnershipResponceFile;
        project.FeasibilityOtherDocuments = FeasibilityOtherDocuments || project.FeasibilityOtherDocuments;
        project.loginDetail = loginDetail || project.loginDetail;
        project.caseStudyRequired = caseStudyRequired || project.caseStudyRequired;
        project.certifications = certifications || project.certifications;
        project.policy = policy || project.policy;
        project.failStatusReason = failStatusReason || project.failStatusReason;

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
            file = await uploadToS3(req.files[0], "files")
        } else if (req.files?.length > 1) {
            file = await uploadMultipleFilesToS3(req.files, "files")
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
            await deleteFromS3(file)
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
            { $match: { category: project.category } },
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

            if (userIds.some((id: any) => id.equals(supplierObjectId))) {
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
            if (!(project.select.some((select: any) => select.supplierId.equals(supplierId)))) {
                project.select.push({ supplierId, companySelect, handoverCall: new Date(handoverCall) });
            }
        }
        if (finalizedId) {
            project.finalizedId = finalizedId
            project.finalizedById = req.user.id
            // project.finalized = {
            //     finalizedId,

            // }


            project.status = projectStatus.Closed
            project.closedDate = new Date()
        }
        if (dropUser) {
            let { userId, reason } = dropUser
            userId = new mongoose.Types.ObjectId(userId)
            if (!(project.dropUser.some((dropUser: any) => dropUser.userId.equals(userId)))) {
                project.dropUser.push({ userId, reason });
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