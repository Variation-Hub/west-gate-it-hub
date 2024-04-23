import { Request, Response } from "express";
import projectModel from "../Models/projectModel";
import mongoose from "mongoose";
import foiModel from "../Models/foiModel";


export const createProject = async (req: Request, res: Response) => {
    try {

        const { projectName, category, industry, description, BOSID, publishDate, submission, link, periodOfContractStart, periodOfContractEnd, dueDate, value, projectType, website, mailID, clientType, clientName } = req.body
        const { data } = req.body;

        const newProjects = await projectModel.insertMany(data)
        // const newProject = await projectModel.create({ projectName, category, industry, description, BOSID, publishDate, submission, link, periodOfContractStart, periodOfContractEnd, dueDate, value, projectType, website, mailID, clientType, clientName })

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
                    shortListUserId: 0,
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

export const getProjects = async (req: Request, res: Response) => {
    try {
        let { keyword, category, industry, projectType, foiNotUploaded } = req.query as any
        category = category?.split(',');
        industry = industry?.split(',');
        projectType = projectType?.split(',');
        console.log(req.pagination?.page, req.pagination?.limit)
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
            if (Object.keys(filter).length > 0) {
                filter = {
                    $and: [
                        filter,
                        { category: { $in: category } }
                    ]
                };
            } else {
                filter = { category: { $in: category } };
            }
        }

        if (industry) {
            if (Object.keys(filter).length > 0) {
                filter = {
                    $and: [
                        filter,
                        { industry: { $in: industry } }
                    ]
                };
            } else {
                filter = { industry: { $in: industry } };
            }
        }

        if (projectType) {
            if (Object.keys(filter).length > 0) {
                filter = {
                    $and: [
                        filter,
                        { projectType: { $in: projectType } }
                    ]
                };
            } else {
                filter = { projectType: { $in: projectType } };
            }
        }
        if (foiNotUploaded) {
            const projectId = (await foiModel.find()).map(foi => foi.projectId)
            console.log(projectId)
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

        console.log(filter);
        const count = await projectModel.countDocuments(filter);
        const projects = await projectModel.find(filter)
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1 });

        console.log(projects.map(project => project._id));

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

        if (!project.shortListUserId.includes(userId)) {
            project.shortListUserId = [...project.shortListUserId, userId];
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