import { Request, Response } from "express"
import projectDetailTitleModel from "../Models/projectDetailTitleModel"
import { areObjectsEqual } from "./projectController";
import { userRoles } from "../Util/contant";

export const createProjectDetailsTitle = async (req: any, res: Response) => {
    try {
        const projectDetailTitle = await projectDetailTitleModel.create(req.body)

        return res.status(200).json({
            message: "Project detail title create success",
            status: true,
            data: projectDetailTitle
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getProjectDetailsTitles = async (req: any, res: Response) => {
    try {
        let { type, projectId } = req.query;

        let filter: any = {}
        if (type) {
            filter.type = type;
        }
        if (projectId) {
            filter.projectId = projectId;
        }
        if (req.user.role !== userRoles.Admin) {
            filter.roles = { $in: [req.user.role] };
        }

        const projectDetailTitle = await projectDetailTitleModel.find(filter)
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1 })
            .exec()

        const count = await projectDetailTitleModel.countDocuments(filter);

        return res.status(200).json({
            message: "Project detail title fetch success",
            status: true,
            data: {
                data: projectDetailTitle,
                meta_data: {
                    page: req.pagination?.page,
                    items: count,
                    page_size: req.pagination?.limit,
                    pages: Math.ceil(count / (req.pagination?.limit as number))
                }
            }
        });
    } catch (err: any) {
        console.log(err);
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const deleteProjectDetailsTitle = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const projectDetailTitle = await projectDetailTitleModel.findByIdAndDelete(id);
        if (!projectDetailTitle) {
            return res.status(404).json({
                message: "Project detail title not found",
                status: false,
                data: null
            });
        }
        return res.status(200).json({
            message: "Project detail title delete success",
            status: true,
            data: projectDetailTitle
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const updateProjectDetailsTitle = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const obj = req.body;

        const updatedProjectDetailTitle = await projectDetailTitleModel.findByIdAndUpdate(
            id,
            { $set: obj },
            { new: true, runValidators: true }
        );

        if (!updatedProjectDetailTitle) {
            return res.status(404).json({
                message: "Project detail title not found",
                status: false,
                data: null
            });
        }

        return res.send({
            message: "Project detail title updated successfully",
            status: true,
            data: updatedProjectDetailTitle
        })
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const deleteProjectDetailsTitleImage = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const obj = req.body;

        const projectDetailTitle: any = await projectDetailTitleModel.findById(id);

        if (!projectDetailTitle) {
            return res.status(404).json({
                message: "Project detail title not found",
                status: false,
                data: null
            });
        }

        const initialLength = projectDetailTitle.images.length;
        projectDetailTitle.images = projectDetailTitle.images.filter(
            (image: any) => !areObjectsEqual(obj, image)
        );

        if (projectDetailTitle.images.length === initialLength) {
            return res.status(404).json({
                message: "Image not found in project detail title",
                status: false,
                data: null
            });
        }

        await projectDetailTitle.save();

        return res.send({
            message: "Project detail title updated successfully",
            status: true,
            data: projectDetailTitle
        })
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}