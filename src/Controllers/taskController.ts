import { Request, Response } from "express"
import taskModel from "../Models/taskModel"
import { PipelineStage } from "mongoose"
import userModel from "../Models/userModel"

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
        const { assignTo, status, pickACategory } = req.query;

        let filter: any = {}
        if (assignTo) {
            filter.assignTo = { $elemMatch: { userId: assignTo } };
        }
        if (pickACategory) {
            filter.pickACategory = pickACategory
        }
        if (status === 'DueDate passed') {
            const date = new Date();
            filter.dueDate = { $lt: date }
        } else if (status && status !== 'DueDate passed') {
            filter.status = status
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
                });
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

        const index = task.comments.findIndex((comment: any) => comment.userId === userId.toString());

        if (index === -1) {
            task.comments.push({
                comment,
                date: new Date(),
                userId: userId.toString(),
            })
        } else {
            task.comments[index] = {
                ...task.comments[index],
                comment
            }
        }

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