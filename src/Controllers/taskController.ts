import { Request, Response } from "express"
import taskModel from "../Models/taskModel"
import userModel from "../Models/userModel"
import { taskStatus } from "../Util/contant"

export const createTask = async (req: any, res: Response) => {
    try {
        const { assignTo } = req.body
        if (assignTo?.length) {
            req.body.assignTo = assignTo.map((userId: string) => {
                return {
                    userId,
                    date: new Date()
                }
            })
        }
        const task = await taskModel.create({ ...req.body, createdBy: req.user._id })

        return res.status(200).json({
            message: "Task create successfully",
            status: true,
            data: task
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const updateTask = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const obj = req.body;

        const task: any = await taskModel.findById(id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
                status: false,
                data: null
            });
        }

        if (obj?.assignTo?.length) {
            const dbAssignTo = task.assignTo.map((assign: any) => assign.userId);

            const toAdd = obj.assignTo.filter((userId: string) => !dbAssignTo.includes(userId));
            const toRemove = dbAssignTo.filter((userId: string) => !obj.assignTo.includes(userId));

            if (toAdd.length > 0) {
                toAdd.forEach((userId: string) => {
                    task.assignTo.push({
                        userId,
                        date: new Date(),
                    });
                });
            }

            if (toRemove.length > 0) {
                task.assignTo = task.assignTo.filter((assign: any) => !toRemove.includes(assign.userId));
            }
            delete obj.assignTo
        }
        Object.keys(obj).forEach(value => {
            if (task[value] !== obj[value]) {
                if (value === 'status') {
                    if (obj[value] === taskStatus.Completed) {
                        task.myDayDate = null;
                    } else if (obj[value] === taskStatus.MyDay) {
                        task.myDayDate = new Date();
                        return;
                    }
                }
            }
            task[value] = obj[value];
        });

        await task.save();

        return res.send({
            message: "Task updated successfully",
            status: true,
            data: task
        })
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const getTasks = async (req: any, res: Response) => {
    try {
        let { assignTo, status, pickACategory, project, myDay } = req.query;

        assignTo = assignTo?.split(',');
        let filter: any = {}
        if (assignTo?.length) {
            console.log("filter")
            filter.assignTo = { $elemMatch: { userId: { $in: assignTo } } };
        }
        if (pickACategory) {
            filter.pickACategory = pickACategory
        }
        if (project) {
            filter.project = project
        }
        if (status === 'DueDate passed') {
            const date = new Date();
            filter.dueDate = { $lt: date }
        } else if (status && status !== 'DueDate passed') {
            filter.status = status
        }
        if (myDay) {
            const now = new Date();
            const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            filter.myDayDate = { $gte: past24Hours, $lte: now };
        }
        const Tasks = await taskModel.find(filter)
            .populate("project", "projectName status")
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1 })
            .exec()

        const count = await taskModel.countDocuments(filter);

        let userIds: any = [];
        Tasks?.forEach((task: any) => {
            task.assignTo.forEach((obj: any) => {
                userIds.push(obj.userId)
            });
            task.comments.forEach((obj: any) => {
                userIds.push(obj.userId)
            });
        })

        if (userIds.length > 0) {
            const users = await userModel.find({ _id: { $in: userIds } }, 'name email role')
            const usersMap = users.reduce((map: any, user: any) => {
                map[user._id] = user;
                return map;
            }, {});

            Tasks.forEach((task: any) => {
                task.assignTo = task.assignTo.map((obj: any) => {
                    const user = usersMap[obj.userId];
                    if (user) {
                        obj.userDetail = user;
                    }
                    return obj;
                });

                task.comments = task.comments.map((obj: any) => {
                    const user = usersMap[obj.userId];
                    if (user) {
                        obj.userDetail = user;
                    }
                    return obj;
                }).reverse();
            });
        }

        return res.status(200).json({
            message: "Tasks fetch success",
            status: true,
            data: {
                data: Tasks,
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

export const deleteTask = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const task = await taskModel.findByIdAndDelete(id);
        if (!task) {
            return res.status(404).json({
                message: "Task not found",
                status: false,
                data: null
            });
        }
        return res.status(200).json({
            message: "Task delete success",
            status: true,
            data: task
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const addCommentToTask = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const { comment } = req.body;
        const userId = req.user._id

        const task: any = await taskModel.findById(id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
                status: false,
                data: null
            });
        }
        const commentId = task.comments[task?.comments?.length - 1]?.commentId + 1 || 1;
        task.comments.push({
            commentId,
            comment,
            date: new Date(),
            userId: userId.toString(),
        })

        await task.save();

        return res.send({
            message: "Task updated successfully",
            status: true,
            data: task
        })
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const updateCommentToTask = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const { comment, commentId } = req.body;
        const userId = req.user._id;

        const task: any = await taskModel.findById(id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
                status: false,
                data: null
            });
        }

        const commentIndex = task.comments.findIndex((c: any) => c.commentId == commentId);
        console.log(commentIndex, commentId, typeof commentId, commentId === task.comments[0].commentId);
        if (commentIndex === -1) {
            return res.status(404).json({
                message: "Comment not found",
                status: false,
                data: null
            });
        }

        const commentToUpdate = task.comments[commentIndex];

        // Ensure the comment exists and belongs to the user (optional)
        // if (commentToUpdate.userId.toString() !== userId.toString()) {
        //     return res.status(403).json({
        //         message: "You are not authorized to update this comment",
        //         status: false,
        //         data: null
        //     });
        // }

        // Check if the comment was updated within 24 hours
        // const lastUpdated = new Date(commentToUpdate.updatedDate || commentToUpdate.createdDate);
        const lastUpdated = new Date(commentToUpdate.date);
        const currentTime = new Date();
        const hoursDifference = (currentTime.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

        if (hoursDifference > 24) {
            return res.status(400).json({
                message: "Comment cannot be updated after 24 hours",
                status: false,
                data: null
            });
        }

        task.comments[commentIndex].comment = comment;
        task.comments[commentIndex].updatedDate = new Date();

        task.markModified('comments');
        await task.save();

        return res.json({
            message: "Comment updated successfully",
            status: true,
            data: task
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};

export const deleteCommentToTask = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const { commentId } = req.body;
        const userId = req.user._id;

        const task: any = await taskModel.findById(id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
                status: false,
                data: null
            });
        }

        const commentIndex = task.comments.findIndex((c: any) => c.commentId === commentId);

        if (commentIndex === -1) {
            return res.status(404).json({
                message: "Comment not found",
                status: false,
                data: null
            });
        }

        // const commentToUpdate = task.comments[commentIndex];

        // const lastUpdated = new Date(commentToUpdate.date);
        // const currentTime = new Date();
        // const hoursDifference = (currentTime.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

        // if (hoursDifference > 24) {
        //     return res.status(400).json({
        //         message: "Comment cannot be delete after 24 hours",
        //         status: false,
        //         data: null
        //     });
        // }

        task.comments.splice(commentIndex, 1);
        task.markModified('comments');
        await task.save();

        return res.json({
            message: "Comment delete successfully",
            status: true,
            data: task
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};