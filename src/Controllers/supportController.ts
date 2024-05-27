import { Request, Response } from "express";
import { deleteMultipleFromS3, uploadMultipleFilesToS3 } from "../Util/aws";
import supportModel from "../Models/supportModel";
import { sendSupportMessageToUser } from "../socket/socketEvent";
import userModel from "../Models/userModel";

export const createSupportMessage = async (req: any, res: Response) => {
    try {
        let { message, messageType, senderId, receiverId, file } = req.body

        if (req.files) {
            file = await uploadMultipleFilesToS3(req.files, "chat")
        }
        const Chat = await supportModel.create({ message, messageType, senderId, receiverId, file })

        sendSupportMessageToUser(receiverId, Chat)

        return res.status(200).json({
            message: "Support chat create success",
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

export const deleteSupportMessage = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const Chat = await supportModel.findByIdAndDelete(id);
        if (!Chat) {
            return res.status(404).json({
                message: "Support chat not found",
                status: false,
                data: null
            });
        }
        if (Chat.file) {
            const keys = Chat.file.map(obj => obj.key)
            deleteMultipleFromS3(keys);
        }

        return res.status(200).json({
            message: "Support chat delete success",
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

export const getSupportMessages = async (req: Request, res: Response) => {
    try {
        const { userId1, userId2 } = req.query;

        if (!userId1 || !userId2) {
            return res.status(400).json({
                message: "Missing required query parameters",
                status: false,
                data: null
            });
        }

        const messages = await supportModel.find({
            $or: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 }
            ]
        }).sort({ createdAt: -1 });

        if (messages.length === 0) {
            return res.status(404).json({
                message: "No messages found between the provided user IDs",
                status: false,
                data: null
            });
        }

        return res.status(200).json({
            message: "Support messages retrieved successfully",
            status: true,
            data: messages
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};

export const getUsersChattedWithUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                message: "Missing required query parameter: userId",
                status: false,
                data: null
            });
        }

        const messages = await supportModel.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        });

        const userIdsSet = new Set<string>();
        messages.forEach(message => {
            if (message.senderId.toString() !== userId) {
                userIdsSet.add(message.senderId.toString());
            }
            if (message.receiverId.toString() !== userId) {
                userIdsSet.add(message.receiverId.toString());
            }
        });

        const userIdsArray = Array.from(userIdsSet);
        const users = await userModel.find({
            _id: { $in: userIdsArray }
        }).select('name email userName');

        return res.status(200).json({
            message: "Users retrieved successfully",
            status: true,
            data: users
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};
