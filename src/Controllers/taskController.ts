import { Request, Response } from "express"
import taskModel from "../Models/taskModel"

export const createTask = async (req: any, res: Response) => {
    try {
        const { assignTo } = req.body
        if (assignTo) {
            req.body.assignDate = new Date()
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

        if (obj?.assignTo && task?.assignTo?.toString() !== obj?.assignTo) {
            obj.assignDate = new Date();
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
        const { assignTo, status } = req.query;

        let filter: any = {}
        if (assignTo) {
            filter.assignTo = assignTo
        }
        if (status === 'DueDate passed') {
            const date = new Date();
            filter.dueDate = { $lt: date }
        } else if (status && status !== 'DueDate passed') {
            filter.status = status
        }
        const Tasks = await taskModel.find(filter)
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1 })

        const count = await taskModel.countDocuments(filter);

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