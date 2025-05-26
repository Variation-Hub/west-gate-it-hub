import { Request, Response } from "express"
import taskModel from "../Models/taskModel"
import userModel from "../Models/userModel"
import { BidManagerStatus, projectStatus, taskStatus, userRoles } from "../Util/contant"
import projectModel from "../Models/projectModel"
import mongoose from "mongoose"
import moment from 'moment';

// Helper function to get date string in YYYY-MM-DD format using Asia/Calcutta timezone
function getDateString(date: Date): string {
    // Convert to Asia/Calcutta timezone and get YYYY-MM-DD format
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Calcutta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };

    const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA gives YYYY-MM-DD format
    return formatter.format(date);
}

// Helper function to format minutes into "X hours Y minutes" format
function formatMinutesToHoursAndMinutes(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    if (hours === 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
}

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
                    log: `${loginUser.name} assigned project to ${user.name}`,
                    userId: req.user._id,
                    date: new Date(),
                    type: "timeBased"
                };

                // Ensure logs is an array before spreading it
                projectDetails.logs = Array.isArray(projectDetails?.logs)
                    ? [logEntry, ...projectDetails.logs]
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
            req.body.type = "Project"
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
            filter.$or = [
                { assignTo: { $elemMatch: { userId: { $in: assignTo } } } },
                { subtasks: { $elemMatch: { resources: { $elemMatch: { candidateId: { $in: assignTo } } } } } }
            ];
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
            // if (req.user.role === userRoles.Admin) { // for admin role to show all the myday data
            //     if (assignTo?.length > 0) {
            //         filter.myDay = {
            //             $in: assignTo.map((id: string) => new mongoose.Types.ObjectId(id))
            //         };
            //     } else {
            //         filter.myDay = { $ne: [] }
            //     }
            // } else {
            //     filter.myDay = { $in: [req.user.id] }
            // }
            filter.myDay = { $in: [req.user.id] };
        }

        const sortOptions: any = {};

        if (sort === "Newest") {
            sortOptions.dueDate = -1;
        } else if (sort === "Oldest") {
            sortOptions.dueDate = 1;
        } else {
            sortOptions.dueDate = -1;
        }

        let allTasks = await taskModel.find(filter)
            .populate("project", "projectName status bidManagerStatus adminStatus")
            .sort(sortOptions)
            .exec();

        let filteredTasks = allTasks;
        if (keyword) {
            filteredTasks = allTasks.filter((task: any) =>
                task.task?.toLowerCase().includes(keyword.toLowerCase()) ||
                task.project?.status?.toLowerCase().includes(keyword.toLowerCase()) ||
                task.project?.bidManagerStatus?.toLowerCase().includes(keyword.toLowerCase())
            );
        }

        const count = filteredTasks.length;

        const limit = req.pagination?.limit as number || 10;
        const skip = req.pagination?.skip as number || 0;
        let Tasks = filteredTasks.slice(skip, skip + limit);

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

            const currentUserId = assignTo?.[0];
            if (req?.user?.role === userRoles.Admin) {
                console.log('Admin view: All tasks and subtasks will be shown');
            } else {
                if (taskObj.subtasks && taskObj.subtasks.length > 0) {
                    taskObj.subtasks = taskObj.subtasks.filter((subtask: any) =>
                        subtask.resources?.some((r: any) => r.candidateId.toString() === currentUserId)
                    );
                }

            }

            return taskObj; // Return the modified object
        });



        return res.status(200).json({
            message: "Tasks fetch success",
            status: true,
            data: {
                data: Tasks,
                meta_data: {
                    page: req.pagination?.page || 1,
                    items: count,
                    page_size: limit,
                    pages: Math.ceil(count / limit)
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

export const addCommentToTask = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const { comment, minutes, date } = req.body;
        const userId = req.user._id;

        if (!comment || !minutes || minutes <= 0) {
            return res.status(400).json({
                message: "Comment and valid minutes are required.",
                status: false,
            });
        }

        const task: any = await taskModel.findById(id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
                status: false,
                data: null
            });
        }

        const today = moment(date || new Date()).startOf('day');
        const todayStr = today.format('YYYY-MM-DD');

        const allTasks = await taskModel.find({
            "comments.userId": userId,
            "comments.date": {
                $gte: today.toDate(),
                $lte: moment(date || new Date()).endOf('day').toDate()
            }
        });

        let totalMinutesToday = 0;
        for (const t of allTasks) {
            for (const c of t.comments) {
                if (
                    c.userId.toString() === userId.toString() &&
                    moment(c.date).format('YYYY-MM-DD') === todayStr &&
                    c.minutes
                ) {
                    totalMinutesToday += c.minutes;
                }
            }
        }

        if (totalMinutesToday + minutes > 1440) {
            return res.status(400).json({
                message: `You cannot log more than 24 hours in a day. You have already logged ${Math.floor(totalMinutesToday / 60)} hours and ${totalMinutesToday % 60} minutes.`,
                status: false
            });
        }

        const commentId = task.comments[task?.comments?.length - 1]?.commentId + 1 || 1;
        task.comments.push({
            commentId,
            comment,
            minutes,
            date: new Date(),
            userId: userId.toString(),
            pin: false,
            auto: false
        })

        await task.save();

        // Only try to update project logs if the task has a project associated
        if (task?.project) {
            const projectDetails: any = await projectModel.findById(task.project);

            // Check if projectDetails exists before trying to access/modify its properties
            if (projectDetails) {
                const loginUser: any = await userModel.findById(req.user._id);

                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;
                const timeDisplay = [
                    hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : '',
                    remainingMinutes > 0 ? `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}` : ''
                ].filter(Boolean).join(', ');

                const logEntry = {
                    log: `${loginUser.name} added comment : ${comment} (${timeDisplay})`,
                    userId: req.user._id,
                    date: new Date(),
                    type: "timeBased"
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
        const { comment, commentId, minutes } = req.body;
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

        if (minutes !== undefined) {
            if (isNaN(minutes) || minutes < 0) {
                return res.status(400).json({
                    message: "Minutes must be a positive number",
                    status: false,
                    data: null
                });
            }

            const commentDate = moment(commentToUpdate.date).startOf('day');
            const commentDateStr = commentDate.format('YYYY-MM-DD');

            const allTasks = await taskModel.find({
                "comments.userId": userId,
                "comments.date": {
                    $gte: commentDate.toDate(),
                    $lte: moment(commentDate).endOf('day').toDate()
                }
            });

            let totalMinutesOnDay = 0;
            for (const t of allTasks) {
                for (const c of t.comments) {
                    if (
                        c.userId.toString() === userId.toString() &&
                        moment(c.date).format('YYYY-MM-DD') === commentDateStr &&
                        c.minutes &&
                        !(t._id.equals(task._id) && c.commentId === commentId) // Exclude current comment
                    ) {
                        totalMinutesOnDay += c.minutes;
                    }
                }
            }

            if (totalMinutesOnDay + minutes > 1440) {
                return res.status(400).json({
                    message: `You cannot log more than 24 hours in a day. You have already logged ${Math.floor(totalMinutesOnDay / 60)} hours and ${totalMinutesOnDay % 60} minutes on this day.`,
                    status: false,
                    data: null
                });
            }

            task.comments[commentIndex].minutes = minutes;
        }

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
        await task.save({ validateBeforeSave: false });

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

        return res.status(200).json({
            message: "Subtasks added successfully",
            success: true,
            task: updatedTask
        });
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

        return res.status(200).json({
            message: "Subtasks deleted successfully",
            success: true,
            task: updatedTask
        });
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

        return res.status(200).json({
            message: "Added candidate to Subtasks successfully",
            success: true,
            task: updatedTask
        });
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
            .populate("subtasks.resources.candidateId", "name")
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

export const logoutAndCommentUnfinishedTasks = async (req: any, res: Response) => {
    try {
        const userId = req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = moment(today).format('YYYY-MM-DD');

        const tasks = await taskModel.find({ "assignTo.userId": userId });

        let totalWorkingMinutes = 0;
        const workedTasksSummary: string[] = [];

        tasks.forEach((task: any) => {
            task.comments.forEach((comment: any) => {
                const commentDate = moment(comment.date).format('YYYY-MM-DD');
                if (
                    comment.userId === userId &&
                    commentDate === todayStr &&
                    comment.minutes
                ) {
                    totalWorkingMinutes += comment.minutes;

                    const hours = Math.floor(comment.minutes / 60);
                    const minutes = comment.minutes % 60;

                    const timeDisplay = [
                        hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : '',
                        minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''
                    ].filter(Boolean).join(', ');

                    workedTasksSummary.push(
                        `${task.task} – ${timeDisplay}`
                    );
                }
            });
        });

        let summaryLine = '';
        if (workedTasksSummary.length > 0) {
            const numberedLines = workedTasksSummary.map((line, i) => `${i + 1}. ${line}`).join('<br>');
            const totalHours = Math.floor(totalWorkingMinutes / 60);
            const totalMinutes = totalWorkingMinutes % 60;

            const totalDisplay = [
                totalHours > 0 ? `${totalHours} hour${totalHours > 1 ? 's' : ''}` : '',
                totalMinutes > 0 ? `${totalMinutes} minute${totalMinutes > 1 ? 's' : ''}` : ''
            ].filter(Boolean).join(', ');

            summaryLine =
                `I did not perform any action on this today because I was focused on the following tasks:<br><br>` +
                numberedLines +
                `<br><br>Worked on the above tasks for a total of ${totalDisplay}.`;
        } else {
            summaryLine = "I did not perform any action on this today.";
        }

        for (const task of tasks) {

            const taskStatus = task.status?.toLowerCase();

            if (taskStatus === 'completed') continue;
            // Get all comments by this user on this task for today
            const todayComments = task.comments.filter((c: any) => {
                const commentDate = new Date(c.date);
                commentDate.setHours(0, 0, 0, 0);
                return c.userId === userId.toString() && commentDate.getTime() === today.getTime();
            });

            // If no comment for today, add auto comment
            if (todayComments.length === 0) {
                const commentId = task.comments[task.comments.length - 1]?.commentId + 1 || 1;

                task.comments.push({
                    commentId,
                    comment: summaryLine,
                    date: new Date(),
                    userId: userId.toString(),
                    minutes: 0,
                    auto: true
                });

                await task.save();
            }
        }

        return res.status(200).json({
            message: "Logout successfully",
            status: true
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};

export const getCommentBoxData = async (req: any, res: Response) => {
    try {
        const userId = req.user._id;

        const tasks = await taskModel.find({ "assignTo.userId": userId });

        const responseData = [];

        for (const task of tasks) {
            const userComments = task.comments.filter(
                (comment: any) => comment.userId === userId.toString()
            );

            let totalMinutes = 0;
            const formattedComments = [];

            const hasRealComment = userComments.some((c: any) => !c.auto);

            for (const comment of userComments) {
                if (comment.auto && hasRealComment) continue;

                // Add minutes to total if available
                if (comment.minutes) {
                    totalMinutes += comment.minutes;
                }

                formattedComments.push({
                    comment: comment.comment,
                    minutes: comment.minutes || 0,
                    date: comment.date,
                    auto: comment.auto || false,
                });
            }

            // Calculate hours from minutes for display
            const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

            // Get first subtask title if available
            const firstSubtaskTitle = task.subtasks && task.subtasks.length > 0
                ? task.subtasks[0].title
                : null;

            responseData.push({
                taskId: task._id,
                taskName: task.task,
                firstSubtaskTitle: firstSubtaskTitle,
                totalHours: totalHours,
                totalMinutes: totalMinutes,
                comments: formattedComments,
            });
        }

        return res.status(200).json({
            message: "Comments fetched successfully",
            status: true,
            data: responseData,
        });
    } catch (error: any) {
        return res.status(500).json({
            status: false,
            message: error.message,
        });
    }
};

export const getTask = async (req: any, res: Response) => {
    try {
        const {id} = req.params;

        const task: any = await taskModel.findById(id).populate("project",  "projectName");;

        if (!task) {
            return res.status(404).json({
                message: "Task not found",
                status: false,
                data: null
            });
        }

        return res.send({
            message: "Task fetched successfully",
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



export const getTaskGraphData = async (req: any, res: Response) => {
    try {
        const { startDate, endDate, userIds, status } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required", status: false, data: null });
        }

        // Parse dates and convert to Asia/Calcutta timezone for consistent handling
        const parsedStartDate = new Date(startDate + 'T00:00:00+05:30'); // Asia/Calcutta timezone
        const parsedEndDate = new Date(endDate + 'T23:59:59+05:30'); // Asia/Calcutta timezone

        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format", status: false, data: null });
        }

        const userIdArray = userIds ? userIds.split(',') : [];

        const filter: any = {
            $or: [
                // Tasks created within the date range
                { createdAt: { $gte: parsedStartDate, $lte: parsedEndDate } },
                // Tasks with comments within the date range
                { "comments.date": { $gte: parsedStartDate, $lte: parsedEndDate } }
            ],
            ...(userIdArray.length && { "assignTo.userId": { $in: userIdArray } })
        };

        // Only add the standard status filter if it's not one of our custom statuses
        if (status && status !== 'complete' && status !== 'pending') {
            filter.status = Array.isArray(status) ? { $in: status } : status;
        }

        const [tasks, users] = await Promise.all([
            taskModel.find(filter)
                .populate("assignTo.userId", "name email role")
                .populate("project", "projectName")
                .sort({ createdAt: -1 }),
            userModel.find(userIdArray.length ? { _id: { $in: userIdArray } } : {}).select("name email role")
        ]);

        const graphData = processGraphData(tasks, users, parsedStartDate, parsedEndDate, status, userIdArray);

        // Get date strings for the response
        const startDateStr = getDateString(parsedStartDate);
        const endDateStr = getDateString(parsedEndDate);

        return res.status(200).json({
            message: "Task graph data fetched successfully",
            status: true,
            data: {
                ...graphData,
                dateRange: {
                    start: startDateStr,
                    end: endDateStr
                }
            }
        });

    } catch (error: any) {
        return res.status(500).json({ message: error.message, status: false, data: null });
    }
};

function processGraphData(tasks: any[], users: any[], start: Date, end: Date, statusFilter?: string, selectedUserIds?: string[]) {
    const result = {
        byUser: {} as any,
        byDate: {} as any,
        summary: {
            totalTasks: tasks.length,
            completedTasks: 0,
            pendingTasks: 0,
            pendingTasksWithAutoComments: 0,
            totalWorkingHours: 0,
            totalWorkingMinutes: 0,
            totalWorkingHoursFormatted: ''
        },
        users: users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role }))
    };

    const getUserInfo = (id: string) => {
        const user = users.find(u => u._id.toString() === id);
        return user ? { id: user._id, name: user.name, email: user.email, role: user.role } :
            { id, name: "Unknown User", email: "", role: "" };
    };

    // Filter tasks based on custom status filters
    let filteredTasks = [...tasks];

    if (statusFilter === 'complete' || statusFilter === 'pending') {
        filteredTasks = [];

        for (const task of tasks) {
            // Check if task is assigned to selected users (if userIds are specified)
            const isAssignedToSelectedUser = !selectedUserIds || selectedUserIds.length === 0 ||
                task.assignTo.some((assignee: any) => {
                    const userId = assignee.userId?._id?.toString() || assignee.userId?.toString();
                    return selectedUserIds.includes(userId);
                });

            // Skip tasks not assigned to selected users when userIds are specified
            if (selectedUserIds && selectedUserIds.length > 0 && !isAssignedToSelectedUser) {
                continue;
            }

            // Filter comments based on date range AND selected users
            const dateAndUserFilteredComments = (task.comments || []).filter((c: any) => {
                const commentDate = new Date(c.date);
                const commentDateStr = getDateString(commentDate);
                const startDateStr = getDateString(start);
                const endDateStr = getDateString(end);
                const isInDateRange = commentDateStr >= startDateStr && commentDateStr <= endDateStr;

                // Also filter by selected users if userIds are provided
                const isFromSelectedUser = !selectedUserIds || selectedUserIds.length === 0 || selectedUserIds.includes(c.userId);

                return isInDateRange && isFromSelectedUser;
            });

            // Check for user-added comments (not auto-generated) within the date range from selected users
            const hasUserCommentsInRange = dateAndUserFilteredComments.some((c: any) => !c.auto);

            // For 'complete' status, include tasks with user-added comments from selected users in the date range
            if (statusFilter === 'complete' && hasUserCommentsInRange) {
                filteredTasks.push(task);
            }

            // For 'pending' status, include tasks with no user comments from selected users in the date range
            // This includes tasks that may have comments outside the date range or from other users
            if (statusFilter === 'pending' && !hasUserCommentsInRange) {
                filteredTasks.push(task);
            }
        }
    }

    // Update the summary count
    result.summary.totalTasks = filteredTasks.length;

    for (const task of filteredTasks) {
        // Filter comments based on date range AND selected users
        const filteredComments = (task.comments || []).filter((c: any) => {
            const commentDate = new Date(c.date);
            const commentDateStr = getDateString(commentDate);
            const startDateStr = getDateString(start);
            const endDateStr = getDateString(end);
            const isInDateRange = commentDateStr >= startDateStr && commentDateStr <= endDateStr;

            // Also filter by selected users if userIds are provided
            const isFromSelectedUser = !selectedUserIds || selectedUserIds.length === 0 || selectedUserIds.includes(c.userId);

            return isInDateRange && isFromSelectedUser;
        });

        // Check for user-added comments (not auto-generated) from selected users within the date range
        const hasUserCommentsInRange = filteredComments.some((c: any) => !c.auto);

        // Set isCompleted to true ONLY if there are user comments from selected users within the date range
        const isCompleted = hasUserCommentsInRange;
        const isPending = !hasUserCommentsInRange;

        // Update summary counts
        if (isCompleted) result.summary.completedTasks++;
        else result.summary.pendingTasks++;

        // Calculate total minutes only from filtered comments
        const taskTotalMinutes = filteredComments.reduce((sum: number, c: any) => sum + (c.minutes || 0), 0);
        const taskTotalHours = +(taskTotalMinutes / 60).toFixed(2);

        // Update summary totals
        result.summary.totalWorkingHours += taskTotalHours;
        result.summary.totalWorkingMinutes += taskTotalMinutes;

        let pendingSince = null;

        // Check for auto comments and user comments in filtered comments
        const hasAutoComments = filteredComments.some((c: any) => c.auto);

        // Calculate pending since for tasks with only auto comments or no comments at all
        if (isPending && (!hasUserCommentsInRange || hasAutoComments)) {
            pendingSince = new Date(task.createdAt);
            if (hasAutoComments) {
                result.summary.pendingTasksWithAutoComments++;
            }
        }

        const taskObj = {
            id: task._id,
            name: task.task,
            status: task.status,
            createdAt: task.createdAt,
            dueDate: task.dueDate,
            project: task.project ? { id: task.project._id, name: task.project.projectName } : null,
            pendingDays: isCompleted ? 0 : Math.floor((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
            totalHours: taskTotalHours,
            totalMinutes: taskTotalMinutes,
            totalHoursFormatted: formatMinutesToHoursAndMinutes(taskTotalMinutes),
            comments: filteredComments.map((c: any) => ({
                id: c.commentId,
                text: c.comment,
                date: c.date, // Include the date string for easier filtering
                minutes: c.minutes || 0,
                user: c.userId,
                auto: c.auto || false
            })),
            isCompleted,
            isPending,
            pendingSince: pendingSince ? getDateString(pendingSince) : null,
            hasAutoComments,
            hasUserComments: hasUserCommentsInRange
        };

        // Use date string for the date key
        const dateKey = getDateString(new Date(task.createdAt));

        for (const assignee of task.assignTo) {
            const userId = assignee.userId?._id?.toString() || assignee.userId?.toString();
            if (!userId) continue;

            // Group by user
            result.byUser[userId] = result.byUser[userId] || {
                user: getUserInfo(userId),
                tasks: [],
                completedTasks: 0,
                pendingTasks: 0,
                pendingTasksWithAutoComments: 0,
                totalHours: 0
            };
            result.byUser[userId].tasks.push(taskObj);

            if (isCompleted) {
                result.byUser[userId].completedTasks++;
            } else {
                result.byUser[userId].pendingTasks++;
                if (isPending) {
                    result.byUser[userId].pendingTasksWithAutoComments++;
                }
            }

            // Update user's total hours
            result.byUser[userId].totalHours += taskTotalHours;

            // Group by date
            result.byDate[dateKey] = result.byDate[dateKey] || {
                date: dateKey,
                tasks: [],
                completedTasks: 0,
                pendingTasks: 0,
                pendingTasksWithAutoComments: 0,
                totalHours: 0,
                totalMinutes: 0,
                totalHoursFormatted: '',
                users: {},
                userTotalHours: {} // Add a map to track total hours per user for each date
            };
            result.byDate[dateKey].tasks.push(taskObj);

            if (isCompleted) {
                result.byDate[dateKey].completedTasks++;
            } else {
                result.byDate[dateKey].pendingTasks++;
                if (isPending) {
                    result.byDate[dateKey].pendingTasksWithAutoComments++;
                }
            }

            // Update date's total hours
            result.byDate[dateKey].totalHours += taskTotalHours;
            result.byDate[dateKey].totalMinutes += taskTotalMinutes;
            result.byDate[dateKey].totalHoursFormatted = formatMinutesToHoursAndMinutes(result.byDate[dateKey].totalMinutes);

            // Track total hours per user for each date
            result.byDate[dateKey].userTotalHours[userId] = result.byDate[dateKey].userTotalHours[userId] || {
                totalHours: 0,
                totalMinutes: 0,
                totalHoursFormatted: ''
            };
            result.byDate[dateKey].userTotalHours[userId].totalHours += taskTotalHours;
            result.byDate[dateKey].userTotalHours[userId].totalMinutes += taskTotalMinutes;
            result.byDate[dateKey].userTotalHours[userId].totalHoursFormatted =
                formatMinutesToHoursAndMinutes(result.byDate[dateKey].userTotalHours[userId].totalMinutes);

            result.byDate[dateKey].users[userId] = result.byDate[dateKey].users[userId] || {
                user: getUserInfo(userId),
                tasks: [],
                completedTasks: 0,
                pendingTasks: 0,
                pendingTasksWithAutoComments: 0,
                totalHours: 0,
                totalMinutes: 0,
                totalHoursFormatted: ''
            };
            result.byDate[dateKey].users[userId].tasks.push(taskObj);

            if (isCompleted) {
                result.byDate[dateKey].users[userId].completedTasks++;
            } else {
                result.byDate[dateKey].users[userId].pendingTasks++;
                if (isPending) {
                    result.byDate[dateKey].users[userId].pendingTasksWithAutoComments++;
                }
            }

            // Update user's total hours in the date
            result.byDate[dateKey].users[userId].totalHours += taskTotalHours;
            result.byDate[dateKey].users[userId].totalMinutes += taskTotalMinutes;
            result.byDate[dateKey].users[userId].totalHoursFormatted =
                formatMinutesToHoursAndMinutes(result.byDate[dateKey].users[userId].totalMinutes);
        }
    }

    // Calculate and format the total working hours for the summary
    result.summary.totalWorkingHoursFormatted = formatMinutesToHoursAndMinutes(result.summary.totalWorkingMinutes);

    // Now let's organize comments by date for each task
    // This will ensure we count comments made on specific dates correctly
    const byDateWithComments = {} as any;

    // First, collect all tasks with their comments
    for (const task of filteredTasks) {
        for (const comment of (task.comments || [])) {
            const commentDate = new Date(comment.date);
            const commentDateStr = getDateString(commentDate);

            // Skip comments outside the date range
            const startDateStr = getDateString(start);
            const endDateStr = getDateString(end);
            if (commentDateStr < startDateStr || commentDateStr > endDateStr) continue;

            // Skip comments from non-selected users when userIds are provided
            if (selectedUserIds && selectedUserIds.length > 0) {
                if (!selectedUserIds.includes(comment.userId)) continue;
            }

            // Initialize the date entry if it doesn't exist
            byDateWithComments[commentDateStr] = byDateWithComments[commentDateStr] || {
                date: commentDateStr,
                tasks: {},
                completedTasks: 0,
                pendingTasks: 0,
                pendingTasksWithAutoComments: 0,
                totalHours: 0,
                totalMinutes: 0,
                totalHoursFormatted: '',
                users: {},
                userTotalHours: {}
            };

            // Initialize the task entry if it doesn't exist
            const taskId = task._id.toString();
            byDateWithComments[commentDateStr].tasks[taskId] = byDateWithComments[commentDateStr].tasks[taskId] || {
                id: task._id,
                name: task.task,
                status: task.status,
                createdAt: task.createdAt,
                dueDate: task.dueDate,
                project: task.project ? { id: task.project._id, name: task.project.projectName } : null,
                comments: [],
                totalHours: 0,
                totalMinutes: 0,
                totalHoursFormatted: '',
                isCompleted: false,
                isPending: true
            };

            // Add the comment to the task
            byDateWithComments[commentDateStr].tasks[taskId].comments.push({
                id: comment.commentId,
                text: comment.comment,
                date: comment.date,
                minutes: comment.minutes || 0,
                user: comment.userId,
                auto: comment.auto || false
            });

            // Update task's total hours
            const minutes = comment.minutes || 0;
            byDateWithComments[commentDateStr].tasks[taskId].totalMinutes += minutes;
            byDateWithComments[commentDateStr].tasks[taskId].totalHours = +(byDateWithComments[commentDateStr].tasks[taskId].totalMinutes / 60).toFixed(2);
            byDateWithComments[commentDateStr].tasks[taskId].totalHoursFormatted = formatMinutesToHoursAndMinutes(byDateWithComments[commentDateStr].tasks[taskId].totalMinutes);

            // Update date's total hours
            byDateWithComments[commentDateStr].totalMinutes += minutes;
            byDateWithComments[commentDateStr].totalHours = +(byDateWithComments[commentDateStr].totalMinutes / 60).toFixed(2);
            byDateWithComments[commentDateStr].totalHoursFormatted = formatMinutesToHoursAndMinutes(byDateWithComments[commentDateStr].totalMinutes);

            // Mark task as completed if it has at least one non-auto comment
            if (!comment.auto) {
                byDateWithComments[commentDateStr].tasks[taskId].isCompleted = true;
                byDateWithComments[commentDateStr].tasks[taskId].isPending = false;
                byDateWithComments[commentDateStr].completedTasks++;
            }

            // Update user data
            for (const assignee of task.assignTo) {
                const userId = assignee.userId?._id?.toString() || assignee.userId?.toString();
                if (!userId) continue;

                // Initialize user entry if it doesn't exist
                byDateWithComments[commentDateStr].users[userId] = byDateWithComments[commentDateStr].users[userId] || {
                    user: getUserInfo(userId),
                    tasks: {},
                    completedTasks: 0,
                    pendingTasks: 0,
                    pendingTasksWithAutoComments: 0,
                    totalHours: 0,
                    totalMinutes: 0,
                    totalHoursFormatted: ''
                };

                // Initialize user's task entry if it doesn't exist
                byDateWithComments[commentDateStr].users[userId].tasks[taskId] = byDateWithComments[commentDateStr].users[userId].tasks[taskId] || {
                    ...byDateWithComments[commentDateStr].tasks[taskId]
                };

                // Update user's total hours
                byDateWithComments[commentDateStr].users[userId].totalMinutes += minutes;
                byDateWithComments[commentDateStr].users[userId].totalHours = +(byDateWithComments[commentDateStr].users[userId].totalMinutes / 60).toFixed(2);
                byDateWithComments[commentDateStr].users[userId].totalHoursFormatted = formatMinutesToHoursAndMinutes(byDateWithComments[commentDateStr].users[userId].totalMinutes);

                // Update user total hours for the date
                byDateWithComments[commentDateStr].userTotalHours[userId] = byDateWithComments[commentDateStr].userTotalHours[userId] || {
                    totalHours: 0,
                    totalMinutes: 0,
                    totalHoursFormatted: ''
                };
                byDateWithComments[commentDateStr].userTotalHours[userId].totalMinutes += minutes;
                byDateWithComments[commentDateStr].userTotalHours[userId].totalHours = +(byDateWithComments[commentDateStr].userTotalHours[userId].totalMinutes / 60).toFixed(2);
                byDateWithComments[commentDateStr].userTotalHours[userId].totalHoursFormatted = formatMinutesToHoursAndMinutes(byDateWithComments[commentDateStr].userTotalHours[userId].totalMinutes);

                // Mark user's task as completed if it has at least one non-auto comment
                if (!comment.auto) {
                    byDateWithComments[commentDateStr].users[userId].completedTasks++;
                }
            }
        }
    }

    // Handle pending tasks that have no comments in the selected date range
    for (const task of filteredTasks) {
        // Check if this task has any comments from selected users in the selected date range
        const hasCommentsInRange = (task.comments || []).some((comment: any) => {
            const commentDate = new Date(comment.date);
            const commentDateStr = getDateString(commentDate);
            const startDateStr = getDateString(start);
            const endDateStr = getDateString(end);
            const isInDateRange = commentDateStr >= startDateStr && commentDateStr <= endDateStr;
            const isFromSelectedUser = !selectedUserIds || selectedUserIds.length === 0 || selectedUserIds.includes(comment.userId);
            return isInDateRange && isFromSelectedUser && !comment.auto;
        });

        // If task has no comments in the selected date range, add it as pending to the start date
        if (!hasCommentsInRange) {
            const startDateStr = getDateString(start);

            // Initialize the date entry if it doesn't exist
            byDateWithComments[startDateStr] = byDateWithComments[startDateStr] || {
                date: startDateStr,
                tasks: {},
                completedTasks: 0,
                pendingTasks: 0,
                pendingTasksWithAutoComments: 0,
                totalHours: 0,
                totalMinutes: 0,
                totalHoursFormatted: '',
                users: {},
                userTotalHours: {}
            };

            // Add the task as pending
            const taskId = task._id.toString();
            if (!byDateWithComments[startDateStr].tasks[taskId]) {
                byDateWithComments[startDateStr].tasks[taskId] = {
                    id: task._id,
                    name: task.task,
                    status: task.status,
                    createdAt: task.createdAt,
                    dueDate: task.dueDate,
                    project: task.project ? { id: task.project._id, name: task.project.projectName } : null,
                    comments: [],
                    totalHours: 0,
                    totalMinutes: 0,
                    totalHoursFormatted: '',
                    isCompleted: false,
                    isPending: true
                };
                byDateWithComments[startDateStr].pendingTasks++;

                // Add to user data for each assignee
                for (const assignee of task.assignTo) {
                    const userId = assignee.userId?._id?.toString() || assignee.userId?.toString();
                    if (!userId) continue;

                    // Skip if not in selected users
                    if (selectedUserIds && selectedUserIds.length > 0 && !selectedUserIds.includes(userId)) continue;

                    // Initialize user entry if it doesn't exist
                    byDateWithComments[startDateStr].users[userId] = byDateWithComments[startDateStr].users[userId] || {
                        user: getUserInfo(userId),
                        tasks: {},
                        completedTasks: 0,
                        pendingTasks: 0,
                        pendingTasksWithAutoComments: 0,
                        totalHours: 0,
                        totalMinutes: 0,
                        totalHoursFormatted: ''
                    };

                    byDateWithComments[startDateStr].users[userId].pendingTasks++;
                    byDateWithComments[startDateStr].users[userId].tasks[taskId] = {
                        ...byDateWithComments[startDateStr].tasks[taskId]
                    };
                }
            }
        }
    }

    // Convert the byDateWithComments object to an array
    const byDateArray = Object.values(byDateWithComments).map((dateData: any) => {
        // Calculate total minutes for each user across all tasks
        const userMinutes: {[key: string]: number} = {};

        // Process all tasks to collect user minutes (only from selected users if filtering)
        Object.values(dateData.tasks).forEach((task: any) => {
            task.comments.forEach((comment: any) => {
                const userId = comment.user;
                if (!userId) return;

                // Only count minutes from selected users when userIds are provided
                if (selectedUserIds && selectedUserIds.length > 0) {
                    if (!selectedUserIds.includes(userId)) return;
                }

                userMinutes[userId] = (userMinutes[userId] || 0) + (comment.minutes || 0);
            });
        });

        // Create enhanced user data with total minutes
        const enhancedUsers = Object.values(dateData.users).map((userData: any) => {
            const userId = userData.user.id.toString();
            return {
                user: userData.user,
                completedTasks: userData.completedTasks,
                pendingTasks: userData.pendingTasks,
                pendingTasksWithAutoComments: userData.pendingTasksWithAutoComments,
                totalHours: +(userMinutes[userId] / 60 || 0).toFixed(2),
                totalMinutes: userMinutes[userId] || 0,
                totalHoursFormatted: formatMinutesToHoursAndMinutes(userMinutes[userId] || 0)
            };
        });

        // Filter tasks to only show comments from selected users when userIds are provided
        const filteredTasks = Object.values(dateData.tasks).map((task: any) => {
            if (selectedUserIds && selectedUserIds.length > 0) {
                return {
                    ...task,
                    comments: task.comments.filter((comment: any) => selectedUserIds.includes(comment.user))
                };
            }
            return task;
        });

        return {
            date: dateData.date,
            completedTasks: dateData.completedTasks,
            pendingTasks: dateData.pendingTasks,
            pendingTasksWithAutoComments: dateData.pendingTasksWithAutoComments,
            totalHours: dateData.totalHours,
            totalMinutes: dateData.totalMinutes,
            totalHoursFormatted: dateData.totalHoursFormatted,
            tasks: filteredTasks, // Use filtered tasks that only show comments from selected users
            users: enhancedUsers,
            userTotalHours: Object.entries(dateData.userTotalHours).map(([userId, hours]: [string, any]) => ({
                userId,
                totalHours: hours.totalHours,
                totalMinutes: hours.totalMinutes,
                totalHoursFormatted: hours.totalHoursFormatted,
                user: getUserInfo(userId)
            }))
        };
    });

    // Create correct byUser data from byDateWithComments
    const correctByUser: any = {};

    // Process all tasks to build correct byUser data
    for (const task of filteredTasks) {
        // Check if this task has any comments from selected users in the selected date range
        const hasCommentsInRange = (task.comments || []).some((comment: any) => {
            const commentDate = new Date(comment.date);
            const commentDateStr = getDateString(commentDate);
            const startDateStr = getDateString(start);
            const endDateStr = getDateString(end);
            const isInDateRange = commentDateStr >= startDateStr && commentDateStr <= endDateStr;
            const isFromSelectedUser = !selectedUserIds || selectedUserIds.length === 0 || selectedUserIds.includes(comment.userId);
            return isInDateRange && isFromSelectedUser && !comment.auto;
        });

        // Get comments from this task that are within the date range and from selected users
        const relevantComments = (task.comments || []).filter((c: any) => {
            const commentDate = new Date(c.date);
            const commentDateStr = getDateString(commentDate);
            const startDateStr = getDateString(start);
            const endDateStr = getDateString(end);
            const isInDateRange = commentDateStr >= startDateStr && commentDateStr <= endDateStr;
            const isFromSelectedUser = !selectedUserIds || selectedUserIds.length === 0 || selectedUserIds.includes(c.userId);
            return isInDateRange && isFromSelectedUser;
        });

        const taskTotalMinutes = relevantComments.reduce((sum: number, c: any) => sum + (c.minutes || 0), 0);
        const taskTotalHours = +(taskTotalMinutes / 60).toFixed(2);

        const taskObj = {
            id: task._id,
            name: task.task,
            status: task.status,
            createdAt: task.createdAt,
            dueDate: task.dueDate,
            project: task.project ? { id: task.project._id, name: task.project.projectName } : null,
            pendingDays: hasCommentsInRange ? 0 : Math.floor((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
            totalHours: taskTotalHours,
            totalMinutes: taskTotalMinutes,
            totalHoursFormatted: formatMinutesToHoursAndMinutes(taskTotalMinutes),
            comments: relevantComments.map((c: any) => ({
                id: c.commentId,
                text: c.comment,
                date: c.date,
                minutes: c.minutes || 0,
                user: c.userId,
                auto: c.auto || false
            })),
            isCompleted: hasCommentsInRange,
            isPending: !hasCommentsInRange,
            pendingSince: hasCommentsInRange ? null : getDateString(new Date(task.createdAt)),
            hasAutoComments: relevantComments.some((c: any) => c.auto),
            hasUserComments: hasCommentsInRange
        };

        // Add to each assigned user
        for (const assignee of task.assignTo) {
            const userId = assignee.userId?._id?.toString() || assignee.userId?.toString();
            if (!userId) continue;

            // Skip if not in selected users
            if (selectedUserIds && selectedUserIds.length > 0 && !selectedUserIds.includes(userId)) continue;

            // Initialize user entry if it doesn't exist
            correctByUser[userId] = correctByUser[userId] || {
                user: getUserInfo(userId),
                tasks: [],
                completedTasks: 0,
                pendingTasks: 0,
                pendingTasksWithAutoComments: 0,
                totalHours: 0
            };

            correctByUser[userId].tasks.push(taskObj);

            if (hasCommentsInRange) {
                correctByUser[userId].completedTasks++;
            } else {
                correctByUser[userId].pendingTasks++;
            }

            correctByUser[userId].totalHours += taskTotalHours;
        }
    }

    const processedByUser = Object.values(correctByUser);

    // Calculate correct summary from byDateWithComments data
    const correctSummary = {
        totalTasks: filteredTasks.length,
        completedTasks: 0,
        pendingTasks: 0,
        pendingTasksWithAutoComments: 0,
        totalWorkingHours: 0,
        totalWorkingMinutes: 0,
        totalWorkingHoursFormatted: ''
    };

    // Calculate summary from the correctly processed byDateWithComments
    const allProcessedTasks = new Set();
    Object.values(byDateWithComments).forEach((dateData: any) => {
        Object.values(dateData.tasks).forEach((task: any) => {
            const taskId = task.id.toString();
            if (!allProcessedTasks.has(taskId)) {
                allProcessedTasks.add(taskId);
                if (task.isCompleted) {
                    correctSummary.completedTasks++;
                } else {
                    correctSummary.pendingTasks++;
                }
                correctSummary.totalWorkingMinutes += task.totalMinutes || 0;
            }
        });
    });

    // Handle tasks that have no comments in the selected date range (they should be pending)
    for (const task of filteredTasks) {
        const taskId = task._id.toString();
        if (!allProcessedTasks.has(taskId)) {
            // This task has no comments in the selected date range from selected users
            correctSummary.pendingTasks++;
        }
    }

    correctSummary.totalWorkingHours = +(correctSummary.totalWorkingMinutes / 60).toFixed(2);
    correctSummary.totalWorkingHoursFormatted = formatMinutesToHoursAndMinutes(correctSummary.totalWorkingMinutes);

    return {
        byUser: processedByUser,
        // Use our new date-based data that correctly groups comments by date
        byDate: byDateArray.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        summary: correctSummary,
        users: result.users,
        dateRange: {
            start: getDateString(start),
            end: getDateString(end)
        }
    };
}