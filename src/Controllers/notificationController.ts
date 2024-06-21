import { Request, Response } from "express"
import notificationModel from "../Models/notificationModel"
import mongoose from "mongoose"
import { sendNotificationToUser } from "../socket/socketEvent"

export const createNotification = async (req: Request, res: Response) => {
    try {
        const { title, discription, userId } = req.body

        const notification = await notificationModel.create({ title, discription, userId })

        sendNotificationToUser(userId, notification)

        return res.status(200).json({
            message: "Notification send success",
            status: true,
            data: notification
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getNotifications = async (req: any, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id)

        const notifications = await notificationModel.find({ userId })

        return res.status(200).json({
            message: "Notifications fetch success",
            status: true,
            data: notifications
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const markreadNotification = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const notification = await notificationModel.findByIdAndUpdate(id, { read: true });
        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
                status: false,
                data: null
            });
        }
        return res.status(200).json({
            message: "Notification marked as read successfully",
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

export const markreadNotifications = async (req: any, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        await notificationModel.updateMany({ userId }, { $set: { read: true } });

        return res.status(200).json({
            message: "Notifications marked as read successfully",
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

export const deleteNotification = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const notification = await notificationModel.findByIdAndDelete(id);
        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
                status: false,
                data: null
            });
        }
        return res.status(200).json({
            message: "Notification delete success",
            status: true,
            data: notification
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const deleteNotifications = async (req: any, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id)

        await notificationModel.deleteMany({ userId });

        return res.status(200).json({
            message: "Notifications delete success",
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

export const getNotificationsCount = async (req: any, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id)

        const notifications = await notificationModel.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: null,
                    totalNotifications: { $sum: 1 },
                    unreadNotifications: {
                        $sum: {
                            $cond: [{ $eq: ["$read", false] }, 1, 0]
                        }
                    }
                }
            }
        ]);
        console.log(notifications)

        const notificationData = notifications[0] || { totalNotifications: 0, unreadNotifications: 0 };

        return res.status(200).json({
            message: "Notifications fetch success",
            status: true,
            data: {
                totalNotifications: notificationData.totalNotifications,
                unreadNotifications: notificationData.unreadNotifications
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