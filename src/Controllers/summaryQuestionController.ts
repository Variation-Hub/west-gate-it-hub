import { Request, Response } from "express"
import summaryQuestionModel from "../Models/summaryQuestionModel"

export const summaryQuestionList = async (req: any, res: Response) => {
    try {
        const projectId = req.query.projectId

        const summaryQuestion = await summaryQuestionModel.find({ projectId })

        return res.status(200).json({
            message: "Summary Question successfully fetched",
            status: true,
            data: summaryQuestion
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const createSummaryQuestion = async (req: any, res: Response) => {
    try {
        let { questionName, question, instructions, refrenceDocument, weightage, deadline, comment, projectId } = req.body

        const summaryQuestion = await summaryQuestionModel.create({ questionName, question, instructions, refrenceDocument, weightage, deadline, comment, projectId })

        return res.status(200).json({
            message: "Summary Question create success",
            status: true,
            data: summaryQuestion
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const updateSummaryQuestion = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        let { questionName, question, instructions, refrenceDocument, weightage, deadline, comment, verify } = req.body
        const summaryQuestion: any = await summaryQuestionModel.findById(id);

        if (!summaryQuestion) {
            return res.status(404).json({
                message: "Summary Question not found",
                status: false,
                data: null
            });
        }
        summaryQuestion.questionName = questionName || summaryQuestion.questionName;
        summaryQuestion.question = question || summaryQuestion.question;
        summaryQuestion.instructions = instructions || summaryQuestion.instructions;
        summaryQuestion.refrenceDocument = refrenceDocument || summaryQuestion.refrenceDocument;
        summaryQuestion.weightage = weightage || summaryQuestion.weightage;
        summaryQuestion.deadline = deadline || summaryQuestion.deadline;
        summaryQuestion.comment = comment || summaryQuestion.comment;
        summaryQuestion.verify = verify || summaryQuestion.verify;

        await summaryQuestion.save();

        return res.send({
            message: "Summary Question updated successfully",
            status: true,
            data: summaryQuestion
        })
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const deleteSummaryQuestion = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const summaryQuestion = await summaryQuestionModel.findByIdAndDelete(id);
        if (!summaryQuestion) {
            return res.status(404).json({
                message: "Summary Question not found",
                status: false,
                data: null
            });
        }
        return res.status(200).json({
            message: "Summary Question delete success",
            status: true,
            data: summaryQuestion
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        })
    }
}

export const addReviewQuestion = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { type, message } = req.body
        const summaryQuestion = await summaryQuestionModel.findById(id);
        if (!summaryQuestion) {
            return res.status(404).json({
                message: "Summary Question not found",
                status: false,
                data: null
            });
        }
        if (summaryQuestion.verify) {
            return res.status(404).json({
                message: "Summary Question is verified",
                status: false,
                data: null
            });
        }

        summaryQuestion.response.push({ type, message })
        summaryQuestion.save();

        return res.status(200).json({
            message: "Summary Question review added successfully",
            status: true,
            data: summaryQuestion
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        })
    }
}
