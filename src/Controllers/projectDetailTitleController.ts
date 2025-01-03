import { Request, Response } from "express"
import projectDetailTitleModel from "../Models/projectDetailTitleModel"

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
        let { userIds, type, projectId } = req.query;

        userIds = userIds?.split(',');
        let filter: any = {}
        if (userIds?.length) {
            filter.userIds = { $in: userIds };
        }
        if (type) {
            filter.type = type;
        }
        if (projectId) {
            filter.projectId = projectId;
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

        const projectDetailTitle: any = await projectDetailTitleModel.findById(id);

        if (!projectDetailTitle) {
            return res.status(404).json({
                message: "Project detail title not found",
                status: false,
                data: null
            });
        }

        Object.keys(obj).forEach(value => {
            projectDetailTitle[value] = obj[value];
        });

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