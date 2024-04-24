import { Request, Response } from "express";
import foiModel from "../Models/foiModel";
import { deleteFromS3, uploadToS3 } from "../Util/aws";
import projectModel from "../Models/projectModel";

export const createFOI = async (req: Request, res: Response) => {
    try {
        let { name, link, projectId } = req.body

        const project = await projectModel.findById(projectId)
        if (!project) {
            return res.status(404).json({
                message: "Project not found",
                status: true,
                data: null
            });
        }
        if (req.file) {
            link = await uploadToS3(req.file, "foi")
        }
        const FOI = await foiModel.create({ name, link, projectId })
        project.timeDue = null;
        project.save()
        return res.status(200).json({
            message: "FOI create success",
            status: true,
            data: FOI
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getFIOs = async (req: Request, res: Response) => {
    try {

        const count = await foiModel.countDocuments();
        const FOIs = await foiModel.find()
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1 });


        return res.status(200).json({
            message: "FOI fetch success",
            status: true,
            data: {
                data: FOIs,
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

export const updateFOI = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { name, projectId } = req.body

        const FOI = await foiModel.findById(id);

        if (!FOI) {
            return res.status(404).json({
                message: 'FOI not found',
                status: false,
                data: null
            })
        }
        const project = await projectModel.findById(projectId)
        if (!project) {
            return res.status(404).json({
                message: "Project not found",
                status: true,
                data: null
            });
        }

        if (req.file) {
            deleteFromS3(FOI.link)
            FOI.link = await uploadToS3(req.file, "foi")
        }
        FOI.name = name || FOI.name;
        FOI.projectId = projectId || FOI.projectId;

        const updateFIO = await FOI.save();

        return res.status(200).json({
            message: "FOI update success",
            status: true,
            data: updateFIO
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const deleteFOI = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const FOI = await foiModel.findById(id);

        if (!FOI) {
            return res.status(404).json({
                message: "FOI not found",
                status: false,
                data: null
            })
        }
        if (FOI.link) {
            deleteFromS3(FOI.link)
        }

        const deleteFOI = await foiModel.findByIdAndDelete(id);

        return res.status(200).json({
            message: "FOI delete success",
            status: true,
            data: deleteFOI
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}