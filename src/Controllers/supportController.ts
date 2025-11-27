import { Request, Response } from "express";
import { deleteFromBackblazeB2, deleteMultipleFromBackblazeB2, uploadMultipleFilesBackblazeB2 } from "../Util/aws";
import supportModel from "../Models/supportModel";
import { sendSupportMessageToUser } from "../socket/socketEvent";
import userModel from "../Models/userModel";
import { userRoles } from "../Util/contant";

export const createSupportMessage = async (req: any, res: Response) => {
    try {
        let { message, messageType, senderId, receiverId, file, messageFor } = req.body

        if (req.files) {
            file = await uploadMultipleFilesBackblazeB2(req.files, "chat")
        }
        const Chat = await supportModel.create({ message, messageType, senderId, receiverId, file, messageFor })

        if (messageFor === "Admin") {
            const admins = await userModel.find({ role: userRoles.Admin })

            admins.forEach((admin: any) => {
                sendSupportMessageToUser(admin._id.toString(), Chat)
            })
        } else {
            sendSupportMessageToUser(receiverId, Chat)
        }

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
            deleteMultipleFromBackblazeB2(keys);
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
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                message: "Missing required query parameters",
                status: false,
                data: null
            });
        }

        const query = {
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        }

        const messages = await supportModel.find(query).sort({ createdAt: -1 });

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
        const { userId, admin } = req.query;

        if (!userId && !admin) {
            return res.status(400).json({
                message: "Missing required query parameter: userId or admin",
                status: false,
                data: null
            });
        }

        let query = {}
        if (admin) {
            query = {
                messageFor: "Admin"
            }
        } else {
            query = {
                $or: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            }
        }

        const messages = await supportModel.find(query);

        const userIdsSet = new Set<string>();
        messages.forEach((message: any) => {
            if (message.senderId.toString() !== userId) {
                userIdsSet.add(message.senderId.toString());
            }
            if (message?.receiverId && message?.receiverId?.toString() !== userId) {
                userIdsSet.add((message.receiverId).toString());
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
