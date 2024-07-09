import { Request, Response } from "express"
import summaryQuestionModel from "../Models/summaryQuestionModel"
import { uploadToAzureBlob } from "../Util/aws"

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

export const summaryQuestionListByUser = async (req: any, res: Response) => {
    try {
        const userId = req.params.userId

        const summaryQuestion = await summaryQuestionModel.find({ assignTo: userId })

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
        let { questionName, question, refrenceDocument, weightage, comment, projectId, summaryQuestionFor, type, sampleFile, instructions } = req.body

        const summaryQuestion = await summaryQuestionModel.create({ questionName, question, refrenceDocument, weightage, comment, projectId, summaryQuestionFor, type, sampleFile, instructions })

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
        let { questionName, question, refrenceDocument, weightage, comment, verify, summaryQuestionFor, assignTo, type, sampleFile, instructions } = req.body
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
        summaryQuestion.refrenceDocument = refrenceDocument || summaryQuestion.refrenceDocument;
        summaryQuestion.weightage = weightage || summaryQuestion.weightage;
        summaryQuestion.comment = comment || summaryQuestion.comment;
        summaryQuestion.verify = verify || summaryQuestion.verify;
        summaryQuestion.summaryQuestionFor = summaryQuestionFor || summaryQuestion.summaryQuestionFor;
        summaryQuestion.assignTo = assignTo || summaryQuestion.assignTo;
        summaryQuestion.type = type || summaryQuestion.type;
        summaryQuestion.sampleFile = sampleFile || summaryQuestion.sampleFile;
        summaryQuestion.instructions = instructions || summaryQuestion.instructions;

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

export const uploadSummaryQuestionDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!req.file) {
            return res.status(401).json({
                message: "Please attach document",
                status: false,
                data: null
            })
        }
        const summaryQuestion: any = await summaryQuestionModel.findById(id);

        if (!summaryQuestion) {
            return res.status(404).json({
                message: "Summary Question not found",
                status: false,
                data: null
            });
        }
        summaryQuestion.responseFile = await uploadToAzureBlob(req.file, "documents");

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

export const getsinglesummaryQuestion = async (req: any, res: Response) => {
    try {
        const Id = req.params.id

        const summaryQuestion = await summaryQuestionModel.findById(Id);

        if (!summaryQuestion) {
            return res.status(404).json({
                message: "Summary Question not found",
                status: false,
                data: null
            });
        }

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

// export const handleErrorInFunction = (req: Request, res: Response) => {
//     try {
//         if (true){
//             const userRepository = userModel.
//             return res.status(500).json({
//                 message: "we want to error in function but we don't have a function to handle this error message ",
//                 status: false,
//                 data: null
//             })
//         }
//     } catch (err: any) {
//         return res.status(500).json({
//             message: err.message,
//             status: false,
//             data: null
//         })
//     }
// }