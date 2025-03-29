import { Request, Response } from "express"
import taskModel from "../Models/taskModel"
import userModel from "../Models/userModel"
import { BidManagerStatus, projectStatus, taskStatus, userRoles } from "../Util/contant"
import projectModel from "../Models/projectModel"
import mongoose from "mongoose"
import moment from 'moment';

export const createTask = async (req: any, res: Response) => {
    try {
        let { assignTo } = req.body
        
        // Ensure assignTo is always an array if provided
        if (assignTo && !Array.isArray(assignTo)) {
            assignTo = [assignTo]; // Convert single value to array
            req.body.assignTo = assignTo;
        } else if (!assignTo) {
            assignTo = []; // Default to empty array if not provided
            req.body.assignTo = assignTo;
        }

        if (req.body?.project && assignTo?.length > 0) {

            const alreadyTask = await taskModel.findOne({
                assignTo: { $elemMatch: { userId: { $in: assignTo } } },
                project: req.body.project
            })
            if (alreadyTask) {
                return res.status(400).json({
                    message: "User already assigned to project",
                    status: false,
                    data: null
                })
            }

            const user: any = await userModel.findById(assignTo[0]).select('name role');

            const projectDetails: any = await projectModel.findById(req.body?.project);

            // Check if projectDetails exists before trying to access/modify its properties
            if (projectDetails) {
                const loginUser: any = await userModel.findById(req.user._id);

                const logEntry = {
                    log: `${loginUser.name} was assign project to ${user.name}`,
                    userId: req.user._id,
                    date: new Date()
                };
                
                // Ensure logs is an array before spreading it
                projectDetails.logs = Array.isArray(projectDetails?.logs) 
                    ? [...projectDetails.logs, logEntry] 
                    : [logEntry];

                await projectDetails.save();
            }

            let otherUserTask: any = await taskModel.aggregate([
                {
                    $match: {
                        project: new mongoose.Types.ObjectId(req.body.project),
                    }
                },
                {
                    $addFields: {
                        firstAssignTo: { $arrayElemAt: ["$assignTo", 0] }
                    }
                },
                {
                    $addFields: {
                        firstAssignToUserId: {
                            $convert: { input: "$firstAssignTo.userId", to: "objectId", onError: null, onNull: null }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "firstAssignToUserId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $match: {
                        "userDetails.role": user.role // Check if the role matches
                    }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $limit: 1
                },
                {
                    $project: {
                        project: 1,
                        assignTo: 1,
                        dueDate: 1,
                        userDetails: { $arrayElemAt: ["$userDetails", 0] } // Only include the first userDetails object
                    }
                }
            ]);
            if (otherUserTask.length > 0) {
                const taskId = otherUserTask[0]._id;
                const updatedAssignTo = assignTo.map((userId: string) => {
                    return {
                        userId,
                        date: new Date(),
                    };
                });
                const data = await taskModel.findOneAndUpdate(
                    { _id: taskId },
                    { $set: { assignTo: updatedAssignTo, dueDate: req.body.dueDate , type : "Project"} },
                    { new: true }
                );

                const user: any = await userModel.findById(assignTo[0])
                if (user.role === userRoles.ProjectManager) {
                    await projectModel.findByIdAndUpdate(req.body?.project, { bidManagerStatus: BidManagerStatus.Awaiting })
                } else if (user.role === userRoles.FeasibilityAdmin || user.role === userRoles.FeasibilityUser) {
                    await projectModel.findByIdAndUpdate(req.body?.project, { status: projectStatus.Awaiting })
                }


                return res.status(200).json({
                    message: "New user assigned to project successfully",
                    status: true,
                    data: data,
                });

            }
        }
        if (Array.isArray(assignTo) && assignTo.length > 0) {
            req.body.assignTo = assignTo.map((userId: string) => {
                return {
                    userId,
                    date: new Date()
                }
            })
        }
        const task = await taskModel.create({ ...req.body, createdBy: req.user._id })
        if (task?.project && task?.assignTo?.length === 1 && Array.isArray(assignTo) && assignTo.length > 0) {
            const user: any = await userModel.findById(assignTo[0])
            if (user && user.role === userRoles.ProjectManager) {
                await projectModel.findByIdAndUpdate(task.project, { bidManagerStatus: BidManagerStatus.Awaiting })
            } else if (user && (user.role === userRoles.FeasibilityAdmin || user.role === userRoles.FeasibilityUser)) {
                await projectModel.findByIdAndUpdate(task.project, { status: projectStatus.Awaiting })
            }
        }
        return res.status(200).json({
            message: "Task create successfully",
            status: true,
            data: task
        });
    } catch (err: any) {
        console.log("err", err);
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const updateTask = async (req: any, res: Response) => {
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
                        task.myDay = [];
                    } else if (obj[value] === taskStatus.MyDay) {
                        if (!task.myDay.includes(req.user.id)) {
                            task.myDay = [...task.myDay, req.user.id];
                        }
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

export const removeTaskFromMyDay = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const { userId } = req.body;

        const task: any = await taskModel.findById(id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
                status: false,
                data: null
            });
        }
        const userObjectId = new mongoose.Types.ObjectId(userId);

        task.myDay = task.myDay.filter((id: any) => !id.equals(userObjectId));

        await task.save();

        return res.send({
            message: "Task remove from myDay successfully",
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
        let { assignTo, status, pickACategory, project, myDay, sort, keyword, type } = req.query;

        assignTo = assignTo?.split(',');
        let filter: any = {}
        // if (keyword) {
        //     filter = {
        //         $or: [
        //             { task: { $regex: keyword, $options: 'i' } },
        //             { 'project.status': { $regex: keyword, $options: 'i' } },
        //         ]
        //     };
        // }
        if (assignTo?.length) {
            filter.assignTo = { $elemMatch: { userId: { $in: assignTo } } };
        }
        if (pickACategory) {
            filter.pickACategory = pickACategory
        }
        if (project) {
            filter.project = project
        }
        if (type) {
            filter.type = type
        }
        if (status === 'DueDate passed') {
            const date = new Date();
            filter.dueDate = { $lt: date }
        } else if (status && status !== 'DueDate passed') {
            filter.status = status
        }
        if (myDay) {
            //     const now = new Date();
            //     const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            if (req.user.role === userRoles.Admin) {
                if (assignTo?.length > 0) {
                    filter.myDay = {
                        $in: assignTo.map((id: string) => new mongoose.Types.ObjectId(id))
                    };
                } else {
                    filter.myDay = { $ne: [] }
                }
            } else {
                filter.myDay = { $in: [req.user.id] }
            }
        }

        const sortOptions: any = {};

        if (sort === "Newest") {
            sortOptions.dueDate = -1;
        } else if (sort === "Oldest") {
            sortOptions.dueDate = 1;
        } else {
            sortOptions.dueDate = -1;
        }

        let Tasks = await taskModel.find(filter)
            .populate("project", "projectName status bidManagerStatus")
            // .limit(req.pagination?.limit as number)
            // .skip(req.pagination?.skip as number)
            .sort(sortOptions)
            .exec()

        // const count = await taskModel.countDocuments(filter);
        if (keyword) {
            Tasks = Tasks.filter((task: any) =>
                task.task?.toLowerCase().includes(keyword.toLowerCase()) ||
                task.project?.status?.toLowerCase().includes(keyword.toLowerCase()) ||
                task.project?.bidManagerStatus?.toLowerCase().includes(keyword.toLowerCase())
            );
        }

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

                task.comments.sort((a: any, b: any) => {
                    if (a.pinnedAt && b.pinnedAt) {
                        return b.pinnedAt - a.pinnedAt; 
                    } else if (a.pinnedAt) {
                        return -1; 
                    } else if (b.pinnedAt) {
                        return 1; 
                    } else {
                        return b.date - a.date; 
                    }
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

        Tasks = Tasks.map((task: any) => {
            const taskObj = task.toObject();
            const createdAt = moment(taskObj.createdAt).startOf('day');
            const today = moment().startOf('day');
            const datewiseComments: any = { pinnedComments: []};

            let currentDate = createdAt.clone();
            while (currentDate.isSameOrBefore(today, 'day')) {
                const dateStr = currentDate.format('YYYY-MM-DD');
                const commentsForDate = taskObj.comments
                .filter((comment: any) => moment(comment.date).isSame(currentDate, 'day') && !comment.pin)
                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

                if (commentsForDate.length > 0 || (currentDate.isoWeekday() !== 6 && currentDate.isoWeekday() !== 7)) {
                    datewiseComments[dateStr] = commentsForDate.length > 0 ? commentsForDate : "No comments available for this date";
                }
                currentDate.add(1, 'day');
            }
            datewiseComments.pinnedComments = taskObj.comments
                .filter((comment: any) => comment.pin)
                .sort((a: any, b: any) => new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime()); 

            // Sort datewiseComments in descending order (pinned remains on top)
            taskObj.datewiseComments = {
                pinnedComments: datewiseComments.pinnedComments,
                ...Object.fromEntries(
                    Object.entries(datewiseComments)
                        .filter(([key]) => key !== "pinnedComments")
                        .sort(([dateA], [dateB]) => moment(dateB).diff(moment(dateA)))
                )
            };
            return taskObj; // Return the modified object
        });


        return res.status(200).json({
            message: "Tasks fetch success",
            status: true,
            data: {
                data: Tasks,
                // meta_data: {
                //     page: req.pagination?.page,
                //     items: count,
                //     page_size: req.pagination?.limit,
                //     pages: Math.ceil(count / (req.pagination?.limit as number))
                // }
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

        // Only try to update project logs if the task has a project associated
        if (task?.project) {
            const projectDetails: any = await projectModel.findById(task.project);
            
            // Check if projectDetails exists before trying to access/modify its properties
            if (projectDetails) {
                const loginUser: any = await userModel.findById(req.user._id);

                const logEntry = {
                    log: `${loginUser.name} was added comment : ${comment}`,
                    userId: req.user._id,
                    date: new Date()
                };
                
                // Ensure logs is an array before spreading it
                projectDetails.logs = Array.isArray(projectDetails?.logs) 
                    ? [...projectDetails.logs, logEntry] 
                    : [logEntry];

                await projectDetails.save();
            }
        }

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

export const pinComment = async (req: Request, res: Response) => {
    try {
        const { taskId, commentId } = req.params;
        const { pin } = req.body;

        const task: any = await taskModel.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found", status: false });
        }

        const commentIndex = task.comments.findIndex((c: any) => c.commentId === Number(commentId));
        if (commentIndex === -1) {
            return res.status(404).json({ message: "Comment not found", status: false });
        }

        const comment = task.comments[commentIndex];

        if (pin) {
            comment.pinnedAt = new Date();
            comment.pin = true;
        } else {
            delete comment.pinnedAt;
            comment.pin = false;
        }
        task.markModified('comments');
        await task.save();

        return res.status(200).json({
            message: pin ? "Comment pinned successfully" : "Comment unpinned successfully",
            status: true,
            pin
        });

    } catch (err: any) {
        return res.status(500).json({ message: err.message, status: false });
    }
};

export const addSubTask = async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { title, description, dueDate, resources } = req.body;
    try {
        const newSubtask = {
            title,
            description,
            dueDate,
            resources: resources || [],
        };

        const updatedTask = await taskModel.findByIdAndUpdate(
            taskId,
            { $push: { subtasks: newSubtask } },
            { new: true }
        );

        res.json({ success: true, task: updatedTask });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};

export const deleteSubTask = async (req: Request, res: Response) => {
    const { taskId, subtaskId } = req.params;

    try {
        const updatedTask = await taskModel.findByIdAndUpdate(
            taskId,
            { $pull: { subtasks: { _id: subtaskId } } },
            { new: true }
        );

        res.json({ success: true, task: updatedTask });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};

export const addCandidate = async (req: Request, res: Response) => {
    const { taskId, subtaskId } = req.params;
    const { candidateId } = req.body;

    try {
        const updatedTask = await taskModel.findOneAndUpdate(
            { _id: taskId, "subtasks._id": subtaskId },
            { $push: { "subtasks.$.resources": { candidateId, assignedAt: new Date() } } },
            { new: true }
        );

        res.json({ success: true, task: updatedTask });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
};

export const getSubTasks = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return res.status(400).json({
                message: "Task ID is required",
                status: false,
                data: null
            });
        }

        if (!mongoose.Types.ObjectId.isValid(taskId as string)) {
            return res.status(400).json({
                message: "Invalid Task ID",
                status: false,
                data: null
            });
        }

        const task = await taskModel.findById(taskId)
            .populate("subtasks.resources.candidateId", "fullName")
            .exec();

            if (!task || !task.subtasks) {
                return res.status(404).json({
                    message: "No subtasks found",
                    status: false,
                    data: []
                });
            }
    
            const sortedSubTasks = task.subtasks.sort((a: any, b: any) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

        return res.status(200).json({
            message: "Subtasks fetched successfully",
            status: true,
            data: sortedSubTasks || []
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
};
