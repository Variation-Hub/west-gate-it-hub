import { Request, Response } from "express"
import { deleteMultipleFromAzureBlob, uploadMultipleFilesToAzureBlob } from "../Util/aws"
import chatModel from "../Models/chatModel"
import projectModel from "../Models/projectModel"
import userModel from "../Models/userModel"
import { sendMessageToUser } from "../socket/socketEvent"

export const chatList = async (req: any, res: Response) => {
    try {
        const { projectId } = req.query

        const count = await chatModel.countDocuments({ projectId });
        const Chat = await chatModel.find({ projectId })
            .populate('mentionList senderId', "name")
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Chat successfully fetched",
            status: true,
            data: {
                data: Chat,
                meta_data: {
                    page: req.pagination?.page,
                    items: count,
                    page_size: req.pagination?.limit,
                    pages: Math.ceil(count / (req.pagination?.limit as number))
                }
            }
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const createChat = async (req: any, res: Response) => {
    try {
        let { message, projectId, messageType, mentionList, senderId, file } = req.body
        mentionList = mentionList?.split(',');

        if (req.files) {
            console.log(req.files)
            file = await uploadMultipleFilesToAzureBlob(req.files, "chat")
        }
        const Chat = await chatModel.create({ message, projectId, messageType, mentionList, senderId, file })

        const project = await projectModel.findById(projectId).select({ userChatList: 1 })
        console.log(project)

        if (project) {
            project?.userChatList?.forEach((user) => {
                console.log(user.toString())
                sendMessageToUser(user.toString(), Chat)
            })
        }

        return res.status(200).json({
            message: "Chat create success",
            status: true,
            data: Chat
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const deleteChat = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const Chat = await chatModel.findByIdAndDelete(id);
        if (!Chat) {
            return res.status(404).json({
                message: "Chat not found",
                status: false,
                data: null
            });
        }
        if (Chat.file) {
            const keys = Chat.file.map(obj => obj.key)
            deleteMultipleFromAzureBlob(keys);
        }

        return res.status(200).json({
            message: "Chat delete success",
            status: true,
            data: Chat
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        })
    }
}


export const addUserToChat = async (req: Request, res: Response) => {
    try {
        const { userId, projectId } = req.body

        const project: any = await projectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({
                message: 'Project not found',
                status: false,
                data: null
            })
        }

        const user = await userModel.findById(userId)
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                status: false,
                data: null
            })
        }

        if (!project.userChatList?.includes(userId)) {
            project.userChatList = [...project.userChatList, userId]
            project.save();

            const Chat = await chatModel.create({ type: 'join', message: `${user.name} is added to chat`, projectId })

            if (project) {
                project?.userChatList?.forEach((user: any) => {
                    sendMessageToUser(user.toString(), Chat)
                })
            }

        } else {
            return res.status(400).json({
                message: "already in chat",
                status: true,
                data: null
            });
        }

        return res.status(200).json({
            message: "user successfully add to chat list",
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

export const getUserChatGroup = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;

        const project = await projectModel.find({ userChatList: userId }).select({ _id: 1, projectName: 1 });

        return res.status(200).json({
            message: "Chat group fetch success",
            status: true,
            data: project
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}