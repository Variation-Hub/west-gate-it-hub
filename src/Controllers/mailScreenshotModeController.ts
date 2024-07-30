import { Request, Response } from "express";
import { deleteFromBackblazeB2, uploadToBackblazeB2 } from "../Util/aws";
import mailScreenshotModel from "../Models/mailScreenshotModel";
import { ImagesType, isValidType } from "../Util/contant";
import projectModel from "../Models/projectModel";

export const createScreenShot = async (req: Request, res: Response) => {
    try {
        let { projectName, BOSId, emailId, link } = req.body

        if (req.file) {
            link = await uploadToBackblazeB2(req.file, "screenshot")
        }

        const mailScreenShot = await mailScreenshotModel.create({ projectName, BOSId, emailId, link })

        const project = await projectModel.findOne({ BOSID: BOSId })
        if (project) {
            project.timeDue = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
            project.save()
        }
        // project?.timeDue.setDate(project?.timeDue + 20);

        return res.status(200).json({
            message: "Mail ScreenShot create success",
            status: true,
            data: mailScreenShot
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getScreenShots = async (req: Request, res: Response) => {
    try {
        console.log(req.pagination?.limit, req.pagination?.skip)
        const count = await mailScreenshotModel.countDocuments();
        const screenshots = await mailScreenshotModel.find()
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Mail ScreenShot fetch success",
            status: true,
            data: {
                data: screenshots,
                meta_data: {
                    page: req.pagination?.page,
                    items: count,
                    page_size: req.pagination?.limit,
                    pages: Math.ceil(count / (req.pagination?.limit as number)),
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

export const updateScreenShot = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { projectName, BOSId, emailId } = req.body


        const screenshot = await mailScreenshotModel.findById(id);
        if (!screenshot) {
            return res.status(404).json({
                message: 'Mail ScreenShot not found',
                status: false,
                data: null
            })
        }
        if (!isValidType(req.file?.mimetype as string, ImagesType)) {
            return res.status(400).json({
                message: 'only images are allowed',
                status: false,
                data: null
            })
        }
        if (req.file) {
            deleteFromBackblazeB2(screenshot.link)
            screenshot.link = await uploadToBackblazeB2(req.file, "screenshot")
        }
        screenshot.projectName = projectName || screenshot.projectName;
        screenshot.BOSId = BOSId || screenshot.BOSId;
        screenshot.emailId = emailId || screenshot.emailId;

        const updateScreenshot = await screenshot.save();

        return res.status(200).json({
            message: "Mail ScreenShot update success",
            status: true,
            data: updateScreenshot
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const deleteScreenShot = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const screenshot = await mailScreenshotModel.findById(id);

        if (!screenshot) {
            return res.status(404).json({
                message: "Mail ScreenShot not found",
                status: false,
                data: null
            })
        }

        const deleteScreenshot = await mailScreenshotModel.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Mail ScreenShot delete success",
            status: true,
            data: deleteScreenshot
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}
