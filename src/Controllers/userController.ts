import { Request, Response } from "express"
import userModel from "../Models/userModel"
import { generateToken } from "../Util/JwtAuth"
import { comparepassword } from "../Util/bcrypt"
import { BidManagerStatus, generatePass, projectStatus, userRoles } from "../Util/contant"
import { emailHelper, sendRegisterMailToSupplier, sendMailForInactiveSupplier, sendMailForProfileUpdate } from "../Util/nodemailer"
import { deleteFromBackblazeB2, uploadToBackblazeB2 } from "../Util/aws"
import projectModel from "../Models/projectModel"
import mongoose from "mongoose"
import { connectUser } from "../socket/socketEvent"
import LoginModel from "../Models/LoginModel"
import caseStudy from "../Models/caseStudy"
import taskModel from "../Models/taskModel"
import FileModel from "../Models/fileModel"
import CandidateCvModel from "../Models/candidateCv"

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, userName } = req.body
        const user = await userModel.findOne({ $or: [{ email }, { userName }] })

        if (user) {
            return res.status(400).json({
                message: "User already exists",
                status: false,
                data: null
            })
        }

        const newUser: any = await userModel.create(req.body)

        const token = generateToken({
            id: newUser._id,
            ...newUser._doc
            // email: newUser.email,
            // name: newUser.name,
            // role: newUser.role,
            // userName: newUser.userName
        })
        return res.status(200).json({
            message: "User create success",
            status: true,
            data: { token }
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const createSuplierUser = async (req: any, res: Response) => {
    try {
        const { userName, email, domain, department } = req.body
        const userId = req.user.id;

        const user = await userModel.findOne({
            $or: [{ email }, { userName }]
        });

        if (user) {
            return res.status(400).json({
                message: "User already exists",
                status: false,
                data: null
            })
        }

        const password = generatePass();
        const newUser = await userModel.create({ userName, email, domain, department, password, role: userRoles.SupplierUser, supplierId: userId })
        emailHelper(email, password).then(data => console.log(data)).catch(err => console.log(err));

        const responseData = {
            email: newUser.email,
            role: newUser.role,
            userName: newUser.userName,
            domain: newUser.domain,
            department: newUser.department,
            supplierId: newUser.supplierId,
            _id: newUser._id,
            doj: newUser.doj,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
        };

        return res.status(200).json({
            message: "User create success",
            status: true,
            data: responseData
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body
        const user: any = await userModel.findOne({ email: email.toLowerCase(), role })

        if (!user) {
            return res.status(404).json({
                message: "user not found",
                status: false,
                data: null
            })
        }

        if (!user.active) {
            return res.status(400).json({
                message: user.activeStatus[0]?.log || 'User deactivated',
                status: false,
                data: null
            })
        }

        user.lastLogin = new Date()
        await user.save()
        if (!(await comparepassword(password, user.password))) {
            return res.status(400).json({
                message: "please enter valid password",
                status: false,
                data: null
            })
        }

        const token = generateToken({
            id: user._id,
            ...user._doc
            // email: user.email,
            // name: user.name,
            // role: user.role,
            // userName: user.userName,
            // plan: user.plan
        })

        if (user.role === userRoles.SupplierAdmin) {
            await LoginModel.create({ userId: user._id })
        }
        return res.status(200).json({
            message: "User login success",
            status: true,
            data: { token }
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const updateUser = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const updateData = req.body;

        // Find user by ID
        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            });
        }

        if (updateData.active === false) {
            user.inactiveDate = new Date();

            await CandidateCvModel.updateMany({ supplierId: id }, { active: false });

            const logEntry = {
                log: updateData.activeStatus,
                userId: req.user._id,
                date: new Date()
            };

            if (updateData?.isSendMail) {
                await sendMailForInactiveSupplier(user?.poc_email);
            }
            user.activeStatus.push(logEntry);
            delete updateData.activeStatus;
        }

        if (updateData.active === true) {
            if (user.subcontractingSupplier) {
                let countCaseStudy = await caseStudy.find({ userId: id })

                if (countCaseStudy.length === 0) {
                    return res.status(400).json({
                        message: "Supplier must have at least one Historical Data to be active.",
                        status: false
                    });
                }
            }

            if (updateData?.isSendMail) {
                await sendRegisterMailToSupplier(user?.poc_email);
            }
            updateData.isInHold = false
        }

        if (updateData.inHoldComment && typeof updateData.inHoldComment === 'string' && updateData.inHoldComment.trim() !== '') {
            user.inHoldComment.push({
                comment: updateData.inHoldComment.trim(),
                date: new Date()
            });
        }
        delete updateData.inHoldComment;

        // Update fields dynamically
        Object.keys(updateData).forEach((key) => {
            if (updateData[key] !== undefined) {
                (user as any)[key] = updateData[key];
            }
        });

        // Save updated user
        const updatedUser = await user.save();

        if (req.body?.isUpdateSendMail || req.body?.isUpdateSendMail == 'true' || req.body?.isUpdateSendMail == 'True') {
            await sendMailForProfileUpdate(req.body?.poc_email, id);
        }

        return res.status(200).json({
            message: "User update success",
            status: true,
            data: updatedUser
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Internal server error",
            status: false,
            data: null
        });
    }
};

// Function to be used for update public details
export const publicUpdateUser = async (req: any, res: Response) => {
    try {
        const id = req.params.id;
        const updateData = req.body;

        updateData['isPOCUserUpdate'] = true;

        // Find user by ID
        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            });
        }

        if (updateData.active === false) {
            user.inactiveDate = new Date();

            await CandidateCvModel.updateMany({ supplierId: id }, { active: false });

            const logEntry = {
                log: updateData.activeStatus,
                userId: req?.user?._id || 'POC user',
                date: new Date()
            };

            user.activeStatus.push(logEntry);
            delete updateData.activeStatus;
        }

        if (updateData.active === true) {
            if (user.subcontractingSupplier) {
                let countCaseStudy = await caseStudy.find({ userId: id })

                if (countCaseStudy.length === 0) {
                    return res.status(400).json({
                        message: "Supplier must have at least one Historical Data to be active.",
                        status: false
                    });
                }
            }

            await sendRegisterMailToSupplier(user?.poc_email);
            updateData.isInHold = false
        }

        if (updateData.inHoldComment && typeof updateData.inHoldComment === 'string' && updateData.inHoldComment.trim() !== '') {
            user.inHoldComment.push({
                comment: updateData.inHoldComment.trim(),
                date: new Date()
            });
        }
        delete updateData.inHoldComment;

        // Update fields dynamically
        Object.keys(updateData).forEach((key) => {
            if (updateData[key] !== undefined) {
                (user as any)[key] = updateData[key];
            }
        });

        // Save updated user
        const updatedUser = await user.save();

        return res.status(200).json({
            message: "User update success",
            status: true,
            data: updatedUser
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Internal server error",
            status: false,
            data: null
        });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.query;

        const findUser = await userModel.findOne({ _id: id })

        if (findUser?.isDeleted === false) {
            await userModel.findByIdAndUpdate(id, { isDeleted: true, active: false });
        }
        else {
            await userModel.findByIdAndDelete(id);
        }

        await CandidateCvModel.deleteMany({ supplierId: id });

        if (!findUser) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }


        return res.status(200).json({
            message: "User delete success",
            status: true,
            data: deleteUser
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const userPasswordChange = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { newPassword, oldPassword } = req.body;

        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }
        if (!(await comparepassword(oldPassword, user?.password || ""))) {
            return res.status(400).json({
                message: "please enter valid old password",
                status: false,
                data: null
            })
        }
        user.password = newPassword;

        await user.save();

        return res.status(200).json({
            message: "User password update success",
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

// Function to be used to the reset password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body;
        console.log("email, password, role ", email, password, role);

        const user = await userModel.findOne({ poc_email: email, role });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        user.password = password;

        await user.save();

        return res.status(200).json({
            message: "User password update success",
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

export const userForgotPassword = async (req: Request, res: Response) => {
    try {
        const { email, role } = req.body;

        const user = await userModel.findOne({ email: email.toLowerCase(), role });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        const newPassword = generatePass();
        user.password = newPassword;

        await user.save();

        emailHelper(email, newPassword).then(data => console.log(data)).catch(err => console.log(err));

        return res.status(200).json({
            message: "Email sent successfully",
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

export const fetchSuplierUser = async (req: any, res: Response) => {
    try {

        const supplierId = req.query?.userId || req.user.id;
        const count = await userModel.countDocuments(
            { role: userRoles.SupplierUser, supplierId },
            { password: 0, categoryList: 0, supplierId: 0 })

        const user = await userModel.find(
            { role: userRoles.SupplierUser, supplierId },
            { password: 0, categoryList: 0, supplierId: 0 })
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "User fetch success",
            status: true,
            data: {
                data: user,
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

export const fetchSuplierAdmin = async (req: any, res: Response) => {
    try {
        const { startDate, endDate, search, resourceSharing, subContracting, status, isDeleted, inHold } = req.query;
        const query: any = { role: userRoles.SupplierAdmin }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.doj = { $gte: start, $lte: end };
        }

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (resourceSharing === "true") {
            query.resourceSharingSupplier = true;
            query.active = true;
        } else if (resourceSharing === "false") {
            query.resourceSharingSupplier = false;
            query.active = true;
        }

        // Subcontracting Filter
        if (subContracting === "true") {
            query.subcontractingSupplier = true;
            query.active = true;
        } else if (subContracting === "false") {
            query.subcontractingSupplier = false;
            query.active = true;
        }

        if (inHold === "true") {
            query.isInHold = true;
        } else if (inHold === "false") {
            query.isInHold = false;
        }

        if (status === "true") {
            query.active = true;
        } else if (status === "false") {
            query.active = false;
        }

        if (typeof isDeleted === "undefined") {
            query.isDeleted = false;
        } else if (isDeleted === "true") {
            query.isDeleted = true;
        } else if (isDeleted === "false") {
            query.isDeleted = false;
        }
        const count = await userModel.countDocuments(query)

        const counts = await userModel.aggregate([
            { $match: { role: userRoles.SupplierAdmin } },
            {
                $facet: {
                    totalCount: [{ $count: "count" }],
                    activeCount: [{ $match: { active: true, isDeleted: false } }, { $count: "count" }],
                    inActiveCount: [{ $match: { active: false, isDeleted: false, isInHold: false } }, { $count: "count" }],
                    resourceSharingCount: [{ $match: { resourceSharingSupplier: true, active: true, isDeleted: false } }, { $count: "count" }],
                    subcontractingCount: [{ $match: { subcontractingSupplier: true, active: true, isDeleted: false } }, { $count: "count" }],
                    inHoldCount: [{ $match: { isInHold: true, isDeleted: false } }, { $count: "count" }]
                }
            }
        ]);
        const isDeletedCount = await userModel.countDocuments({ role: userRoles.SupplierAdmin, isDeleted: true });

        const extractCount = (arr: any[]) => (arr[0]?.count || 0);

        let user = await userModel.find(query)
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ active: -1, createdAt: -1 });

        console.log("user", user)

        const userIds = user.map(u => u._id);

        let userList = await userModel.find({ active: true });

        let totalSupplierEmployeeCount = 0;
        userList?.map((element) => {
            if (element?.employeeCount) {
                totalSupplierEmployeeCount = Number(totalSupplierEmployeeCount) + Number(element?.employeeCount)
            }
        })

        const candidateCounts = await CandidateCvModel.aggregate([
            {
                $match: {
                    supplierId: { $in: userIds }
                }
            },
            {
                $group: {
                    _id: "$supplierId",
                    totalCandidates: { $sum: 1 }
                }
            }
        ]);

        const candidateMap = new Map(candidateCounts.map(item => [item._id.toString(), item.totalCandidates]));
        const projects = await projectModel.find({
            bidManagerStatus: { $in: ["InSolution", "WaitingForResult"] },
            selectedUserIds: {
                $elemMatch: {
                    userId: { $in: userIds },
                    isSelected: true
                }
            }
        }).select("projectName bidManagerStatus selectedUserIds");

        const userWithProjects = user.map(u => {
            const sortedInHoldComments = u.inHoldComment?.sort(
                (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            const sortedActiveStatus = u.activeStatus?.sort(
                (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            const assignedProjects = projects.filter(project =>
                project.selectedUserIds.some(sel =>
                    sel.userId?.toString() === u._id.toString() && sel.isSelected === true
                )
            );

            const totalCandidates = candidateMap.get(u._id.toString()) || 0;

            return {
                ...u.toObject(),
                inHoldComment: sortedInHoldComments,
                activeStatus: sortedActiveStatus,
                assignedProjects,
                assignedProjectCount: assignedProjects?.length,
                totalCandidates
            };
        });
        return res.status(200).json({
            message: "User fetch success",
            status: true,
            data: {
                data: userWithProjects,
                count: {
                    total: extractCount(counts[0].totalCount),
                    active: extractCount(counts[0].activeCount),
                    inActive: extractCount(counts[0].inActiveCount),
                    resourceSharingCount: extractCount(counts[0].resourceSharingCount),
                    subcontractingCount: extractCount(counts[0].subcontractingCount),
                    inHoldCount: extractCount(counts[0].inHoldCount),
                    isDeletedCount,
                    totalSupplierEmployeeCount
                },
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

export const publicSuplierAdmin = async (req: any, res: Response) => {
    try {
        const { startDate, endDate, search, resourceSharing, subContracting, status, isDeleted, inHold, projectName, expertise, tags } = req.query;
        const query: any = {
            role: userRoles.SupplierAdmin,
            active: true  // Only return active suppliers
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.doj = { $gte: start, $lte: end };
        }

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (resourceSharing === "true") {
            query.resourceSharingSupplier = true;
            query.active = true;
        } else if (resourceSharing === "false") {
            query.resourceSharingSupplier = false;
            query.active = true;
        }

        // Subcontracting Filter
        if (subContracting === "true") {
            query.subcontractingSupplier = true;
            query.active = true;
        } else if (subContracting === "false") {
            query.subcontractingSupplier = false;
            query.active = true;
        }

        if (inHold === "true") {
            query.isInHold = true;
        } else if (inHold === "false") {
            query.isInHold = false;
        }


        if (typeof isDeleted === "undefined") {
            query.isDeleted = false;
        } else if (isDeleted === "true") {
            query.isDeleted = true;
        } else if (isDeleted === "false") {
            query.isDeleted = false;
        }

        // Build aggregation pipeline for filters
        let aggregationPipeline: any[] = [
            { $match: query }  // This already includes active: true
        ];

        // Add projectName filter
        if (projectName) {
            aggregationPipeline.push({
                $lookup: {
                    from: "projects",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $anyElementTrue: {
                                                $map: {
                                                    input: { $ifNull: ["$selectedUserIds", []] },
                                                    as: "selectedUser",
                                                    in: { $eq: ["$$selectedUser.userId", "$$userId"] }
                                                }
                                            }
                                        },
                                        { $regexMatch: { input: "$projectName", regex: projectName, options: "i" } }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "matchedProjects"
                }
            });
            aggregationPipeline.push({
                $match: {
                    "matchedProjects.0": { $exists: true }
                }
            });
        }

        // Add expertise filter (searches in both names and tags)
        if (expertise) {
            // Add lookup to get tags from masterList for both expertise fields
            aggregationPipeline.push({
                $lookup: {
                    from: "masterlists",
                    localField: "expertise.itemId",
                    foreignField: "_id",
                    as: "expertiseWithTags"
                }
            });

            aggregationPipeline.push({
                $lookup: {
                    from: "masterlists",
                    localField: "expertiseICanDo.itemId",
                    foreignField: "_id",
                    as: "expertiseICanDoWithTags"
                }
            });

            // Match in expertise name, expertiseICanDo name, OR their tags arrays
            aggregationPipeline.push({
                $match: {
                    $or: [
                        { "expertise.name": { $regex: expertise, $options: "i" } },
                        { "expertiseICanDo.name": { $regex: expertise, $options: "i" } },
                        { "expertiseWithTags.tags": { $elemMatch: { $regex: expertise, $options: "i" } } },
                        { "expertiseICanDoWithTags.tags": { $elemMatch: { $regex: expertise, $options: "i" } } }
                    ]
                }
            });
        }

        if (tags) {
            if (!expertise) {
                aggregationPipeline.push({
                    $lookup: {
                        from: "masterlists",
                        localField: "expertise.itemId",
                        foreignField: "_id",
                        as: "expertiseWithTags"
                    }
                });

                aggregationPipeline.push({
                    $lookup: {
                        from: "masterlists",
                        localField: "expertiseICanDo.itemId",
                        foreignField: "_id",
                        as: "expertiseICanDoWithTags"
                    }
                });
            }

            aggregationPipeline.push({
                $match: {
                    $or: [
                        { "expertiseWithTags.tags": { $elemMatch: { $regex: tags, $options: "i" } } },
                        { "expertiseICanDoWithTags.tags": { $elemMatch: { $regex: tags, $options: "i" } } }
                    ]
                }
            });
        }

        // Get count using aggregation if complex filters are applied
        let count: number;
        if (projectName || expertise || tags) {
            const countPipeline = [...aggregationPipeline, { $count: "total" }];
            const countResult = await userModel.aggregate(countPipeline);
            count = countResult.length > 0 ? countResult[0].total : 0;
        } else {
            count = await userModel.countDocuments(query);
        }

        const counts = await userModel.aggregate([
            { $match: { role: userRoles.SupplierAdmin, active: true } }, // Only count active suppliers
            {
                $facet: {
                    totalCount: [{ $count: "count" }],
                    activeCount: [{ $match: { active: true, isDeleted: false } }, { $count: "count" }] 
                }
            }
        ]);
        const isDeletedCount = await userModel.countDocuments({ role: userRoles.SupplierAdmin, isDeleted: true, active: true }); // Only active deleted suppliers

        const extractCount = (arr: any[]) => (arr[0]?.count || 0);

        // Get users using aggregation if complex filters are applied
        let user: any[];
        if (projectName || expertise || tags) {
            // Add pagination and sorting to aggregation pipeline
            aggregationPipeline.push(
                { $sort: { active: -1, createdAt: -1 } },
                { $skip: req.pagination?.skip || 0 },
                { $limit: req.pagination?.limit || 10 }
            );
            user = await userModel.aggregate(aggregationPipeline);
        } else {
            user = await userModel.find(query)
                .limit(req.pagination?.limit as number)
                .skip(req.pagination?.skip as number)
                .sort({ active: -1, createdAt: -1 });
        }

        const userIds = user.map(u => u._id);

        let userList = await userModel.find({ active: true });

        let totalSupplierEmployeeCount = 0;
        userList?.map((element) => {
            if (element?.employeeCount) {
                totalSupplierEmployeeCount = Number(totalSupplierEmployeeCount) + Number(element?.employeeCount)
            }
        })

        const candidateCounts = await CandidateCvModel.aggregate([
            {
                $match: {
                    supplierId: { $in: userIds }
                }
            },
            {
                $group: {
                    _id: "$supplierId",
                    totalCandidates: { $sum: 1 }
                }
            }
        ]);

        const candidateMap = new Map(candidateCounts.map(item => [item._id.toString(), item.totalCandidates]));
        const projects = await projectModel.find({
            bidManagerStatus: { $in: ["InSolution", "WaitingForResult"] },
            selectedUserIds: {
                $elemMatch: {
                    userId: { $in: userIds },
                    isSelected: true
                }
            }
        }).select("projectName bidManagerStatus selectedUserIds");

        const userWithProjects = user.map(u => {
            const assignedProjects = projects.filter(project =>
                project.selectedUserIds.some(sel =>
                    sel.userId?.toString() === u._id.toString() && sel.isSelected === true
                )
            );

            const totalCandidates = candidateMap.get(u._id.toString()) || 0;

            return {
                ...(u.toObject ? u.toObject() : u),
                assignedProjects,
                assignedProjectCount: assignedProjects?.length,
                totalCandidates
            };
        });
        return res.status(200).json({
            message: "User fetch success",
            status: true,
            data: {
                data: userWithProjects,
                count: {
                    total: extractCount(counts[0].totalCount),
                    active: extractCount(counts[0].activeCount),
                    totalSupplierEmployeeCount
                },
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

export const updateAvatar = async (req: any, res: Response) => {
    try {

        const userId = req.user.id;

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        if (req.file) {
            if (user.avatar) {
                deleteFromBackblazeB2(user.avatar)
            }
            user.avatar = await uploadToBackblazeB2(req.file, "cv") as any
        }

        await user.save();

        return res.status(200).json({
            message: "User update success",
            status: true,
            data: user
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const updateSuplierAdmin = async (req: any, res: Response) => {
    try {

        const supplierId = req.user.id;

        const user = await userModel.findById(supplierId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        if (req.file) {
            if (user.cv) {
                deleteFromBackblazeB2(user.cv)
            }
            user.cv = await uploadToBackblazeB2(req.file, "cv") as any
        }

        await user.save();

        return res.status(200).json({
            message: "User update success",
            status: true,
            data: user
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getUserDetails = async (req: any, res: Response) => {
    try {

        const userID = req.user.id;

        const user = await userModel.findById(userID).select({ password: 0 });;

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }

        return res.status(200).json({
            message: "User detail fetch success",
            status: true,
            data: user
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}
export const getSupplierDetails = async (req: any, res: Response) => {
    try {

        const userID = req.params.id;
        const { expertise } = req.query;
        const loggedInUser = req.user;
        const user = await userModel.findById(userID).select({ password: 0 });;

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                data: null
            })
        }
        let files: any = [];

        if (loggedInUser.role === userRoles.Admin || loggedInUser.id === userID) {
            files = await FileModel.find({ supplierId: userID })
                .populate({ path: "supplierId", select: "name" })
                .populate({ path: "userId", select: "name" });

            if (expertise) {
                files = files.filter((file: any) => file.expertise?.includes(expertise));

            }
        }

        const expertiseCount = user.expertise?.map(exp => ({
            _id: exp._id,
            name: exp.name,
            subExpertise: exp.subExpertise,
            subExpertiseCount: exp.subExpertise?.length || 0
        })) || [];

        const projects = await projectModel.find({
            bidManagerStatus: { $in: ["InSolution", "WaitingForResult"] },
            selectedUserIds: {
                $elemMatch: {
                    userId: userID,
                    isSelected: true
                }
            }
        }).select("projectName bidManagerStatus selectedUserIds");

        expertiseCount.sort((a, b) => b.subExpertiseCount - a.subExpertiseCount);

        if (user.inHoldComment && user.inHoldComment.length > 0) {
            user.inHoldComment = user.inHoldComment.sort(
                (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        }

        if (user.activeStatus && user.activeStatus.length > 0) {
            user.activeStatus = user.activeStatus.sort(
                (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        }
        return res.status(200).json({
            message: "User detail fetch success",
            status: true,
            data: user,
            assignedProjects: projects,
            expertiseCount,
            totalExpertiseCount: expertiseCount?.length,
            files: files
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getUserList = async (req: any, res: Response) => {
    try {
        const projectCount = (req.query.projectCount);
        const projectId = req.query.projectId;
        const taskCount = req.query.taskCount;
        const taskPage = req.query.taskPage;
        const type = req.query.type;
        const pickACategory = req.query.pickACategory;
        const search = req.query.search;

        if (projectId) {
            const project = await projectModel.findById(projectId);

            const casestudy = await caseStudy.find({ category: project?.category });

            const userIds = casestudy.map((caseItem) => caseItem.userId);

            const users = await userModel.find({ _id: { $in: userIds } }).sort({ createdAt: -1 });

            return res.status(200).json({
                message: "User list fetch success",
                status: true,
                data: users
            });
        }

        let filter: any = {};

        if (req.query.userRoles) {
            const userRoles = (req.query.userRoles).split(",");
            filter.role = { $in: userRoles };
        }

        // Add search functionality
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } },
                { domain: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { poc_name: { $regex: search, $options: 'i' } },
                { poc_phone: { $regex: search, $options: 'i' } },
                { poc_email: { $regex: search, $options: 'i' } }
            ];
        }

        let users: any = await userModel.find(filter).select({ password: 0 }).sort({ createdAt: -1 }).lean();
        if (projectCount) {
            const result = await projectModel.aggregate([
                { $unwind: "$select" },
                { $group: { _id: "$select.supplierId", count: { $sum: 1 } } },
                { $project: { _id: 0, supplierId: "$_id", projectCount: "$count" } }
            ]);
            users = users.map((user: any) => {
                const supplierCount = result.find((item) => new mongoose.Types.ObjectId(item.supplierId).equals(user._id));
                if (supplierCount) {
                    return {
                        ...user,
                        projectCount: supplierCount.projectCount
                    };
                } else {
                    return {
                        ...user,
                        projectCount: 0
                    };
                }
            });
        }

        if (taskCount) {
            let filter: any[] = [];
            let result = [];
            if (taskPage === "myDay") {
                result = await taskModel.aggregate([
                    { $match: { myDay: { $in: [new mongoose.Types.ObjectId(req.user.id)] } } },
                    { $unwind: "$assignTo" },
                    { $group: { _id: "$assignTo.userId", count: { $sum: 1 } } },
                    { $project: { _id: 0, userId: "$_id", taskcount: "$count" } }
                ]);
            } else {
                if (type) {
                    filter.push({ $match: { type: type } });
                }
                if (pickACategory) {
                    filter.push({ $match: { pickACategory: pickACategory } });
                }
                if (taskPage === "Ongoing" || taskPage === "Completed") {
                    filter.push({ $match: { status: taskPage } });
                }

                filter.push(
                    { $unwind: "$assignTo" },
                    { $group: { _id: "$assignTo.userId", count: { $sum: 1 } } },
                    { $project: { _id: 0, userId: "$_id", taskcount: "$count" } }
                );

                result = await taskModel.aggregate(filter);
            }

            // console.log(result)
            users = users.map((user: any) => {
                const supplierCount = result.find((item) => new mongoose.Types.ObjectId(item.userId).equals(user._id));
                if (supplierCount) {
                    return {
                        ...user,
                        taskcount: supplierCount.taskcount
                    };
                } else {
                    return {
                        ...user,
                        taskcount: 0
                    };
                }
            });
        }

        if (req.query.userRoles === userRoles.SupplierAdmin) {
            users = await Promise.all(users.map(async (user: any, index: number) => {
                const userId = user._id;

                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                const today = new Date();
                today.setHours(23, 59, 59, 999);

                const daysInRange = [];
                const startDate = new Date(oneWeekAgo);
                startDate.setDate(oneWeekAgo.getDate() + 1);

                for (let d = startDate; d <= today; d.setDate(d.getDate() + 1)) {
                    daysInRange.push(new Date(d).toISOString().split("T")[0]);
                }

                const rawData = await LoginModel.find({
                    userId,
                    createdAt: { $gte: oneWeekAgo, $lte: today },
                });

                const groupedData: Record<string, any[]> = {};
                daysInRange.forEach((day) => {
                    groupedData[day] = [];
                });

                rawData.forEach((record: any) => {
                    const dateKey = new Date(record.createdAt).toISOString().split("T")[0];
                    const time = new Date(record.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: "Asia/Kolkata",
                    });

                    if (groupedData[dateKey]) {
                        groupedData[dateKey].push({ loginTime: time });
                    }
                });

                return {
                    ...user,
                    loginDetails: groupedData
                };
            }));
        }

        return res.status(200).json({
            message: "User list fetch success",
            status: true,
            data: users
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getAdminDashboardData = async (req: any, res: Response) => {
    try {
        const { duration, startDate, endDate, categorisation } = req.query;
        let createdAtFilter = {};
        if (duration) {
            if (duration === "yearly") {
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();
                const startOfYear = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0)); // Start of the year in UTC
                const currentIST = new Date(currentDate.getTime() + 5.5 * 60 * 60 * 1000); // Adjust to IST
                createdAtFilter = {
                    publishDate: {
                        $gte: startOfYear,
                        $lt: currentIST
                    }
                };
            } else if (duration === "weekly") {
                const currentDate = new Date();
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                startOfWeek.setHours(0, 0, 0, 0); // Set to midnight
                const currentIST = new Date(currentDate.getTime() + 5.5 * 60 * 60 * 1000); // Adjust to IST
                createdAtFilter = {
                    publishDate: {
                        $gte: new Date(startOfWeek.getTime() + 5.5 * 60 * 60 * 1000), // Adjust to IST
                        $lt: currentIST
                    }
                };
            } else if (duration === "monthly") {
                const currentDate = new Date();
                const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const currentIST = new Date(currentDate.getTime() + 5.5 * 60 * 60 * 1000); // Adjust to IST
                createdAtFilter = {
                    publishDate: {
                        $gte: new Date(startOfMonth.getTime() + 5.5 * 60 * 60 * 1000), // Adjust to IST
                        $lt: currentIST
                    }
                };
            } else {
                const currentDate = new Date();
                const startOfDay = new Date(currentDate);
                startOfDay.setHours(0, 0, 0, 0);
                const currentIST = new Date(currentDate.getTime() + 5.5 * 60 * 60 * 1000); // Adjust to IST
                createdAtFilter = {
                    publishDate: {
                        $gte: new Date(startOfDay.getTime() + 5.5 * 60 * 60 * 1000), // Adjust to IST
                        $lt: currentIST
                    }
                };
            }

        } else if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            end.setHours(23, 59, 59, 999);

            createdAtFilter = {
                publishDate: {
                    $gte: start,
                    $lte: end
                }
            };
        }

        const projects = await projectModel.find(createdAtFilter).select({ status: 1, maxValue: 1, category: 1, bidManagerStatus: 1, categorisation: 1, projectType: 1 });
        let data: any = {
            projectsPosted: {
                count: projects.length,
                maxValue: 0
            },
            projectsMatched: {
                count: 0,
                maxValue: 0
            },
            projectsClosed: {
                count: 0,
                maxValue: 0
            },
            projectsAwaiting: {
                count: 0,
                maxValue: 0
            },
            projectsInProgress: {
                count: 0,
                maxValue: 0
            },
            projectsInHold: {
                count: 0,
                maxValue: 0
            },
            TotalDocumentsNotFound: {
                count: 0,
                maxValue: 0
            },
            projectsPassed: {
                count: 0,
                maxValue: 0
            },
            projectsFail: {
                count: 0,
                maxValue: 0
            },
            projectsBidStatusAwaiting: {
                count: 0,
                maxValue: 0
            },
            projectsBidStatusInSolution: {
                count: 0,
                maxValue: 0
            },
            projectsBidStatusWaitingForResult: {
                count: 0,
                maxValue: 0
            },
            projectsBidStatusDroppedAfterFeasibility: {
                count: 0,
                maxValue: 0
            },
            projectsBidStatusAwarded: {
                count: 0,
                maxValue: 0
            },
            projectsBidStatusNotAwarded: {
                count: 0,
                maxValue: 0
            },
            projectsBidStatusToAction: {
                count: 0,
                maxValue: 0
            },
            projectsBidStatusNosuppliermatched: {
                count: 0,
                maxValue: 0
            },
            projectsBidStatusGoNoGoStage1: {
                count: 0,
                maxValue: 0
            },
            projectsBidStatusSupplierConfirmation: {
                count: 0,
                maxValue: 0
            },
            projectsBidStatusGoNoGoStage2: {
                count: 0,
                maxValue: 0
            },
            // categoryWise: {},
            projectTypeWise: {},
            categorisationWise: {
                "DPS": 0,
                "DTD": 0,
                "Framework": 0
            },
        };

        // const uniqueCategories = await userModel.distinct("categoryList");
        const uniqueCategories = await caseStudy.distinct("category");
        // const projectCategory = await projectModel.distinct("category");

        const obj: any = {}
        projects.forEach((project: any) => {

            if (project.categorisation === "DPS/Framework") {
                return;
            }
            if (project.status !== projectStatus.NotReleted) {
                // if (project.categorisation === "DPS") {
                //     data.categorisationWise["DPS"]++;
                // }
                // if (project.categorisation === "Framework") {
                //     data.categorisationWise["Framework"]++;
                // }
                if (!categorisation || project.categorisation === categorisation) {
                    data.projectsPosted.maxValue += project.maxValue;
                    if (project.status === projectStatus.Won) {
                        data.projectsClosed.count += 1;
                        data.projectsClosed.maxValue += project.maxValue;
                    }
                    else if (project.status === projectStatus.Awaiting) {
                        data.projectsAwaiting.count += 1;
                        data.projectsAwaiting.maxValue += project.maxValue;
                    } else if (project.status === projectStatus.InSolution) {
                        data.projectsInProgress.count += 1;
                        data.projectsInProgress.maxValue += project.maxValue;
                    } else if (project.status === projectStatus.Inhold) {
                        data.projectsInHold.count += 1;
                        data.projectsInHold.maxValue += project.maxValue;
                    } else if (project.status === projectStatus.DocumentsNotFound) {
                        data.TotalDocumentsNotFound.count += 1;
                        data.TotalDocumentsNotFound.maxValue += project.maxValue;
                    } else if (project.status === projectStatus.Passed) {
                        data.projectsPassed.count += 1;
                        data.projectsPassed.maxValue += project.maxValue;
                    } else if (project.status === projectStatus.Fail) {
                        data.projectsFail.count += 1;
                        data.projectsFail.maxValue += project.maxValue;
                    }

                    if (project.bidManagerStatus === BidManagerStatus.Awaiting) {
                        data.projectsBidStatusAwaiting.count += 1;
                        data.projectsBidStatusAwaiting.maxValue += project.maxValue;
                    } else if (project.bidManagerStatus === BidManagerStatus.InSolution) {
                        data.projectsBidStatusInSolution.count += 1;
                        data.projectsBidStatusInSolution.maxValue += project.maxValue;
                    } else if (project.bidManagerStatus === BidManagerStatus.WaitingForResult) {
                        data.projectsBidStatusWaitingForResult.count += 1;
                        data.projectsBidStatusWaitingForResult.maxValue += project.maxValue;
                    } else if (project.bidManagerStatus === BidManagerStatus.DroppedAfterFeasibility) {
                        data.projectsBidStatusDroppedAfterFeasibility.count += 1;
                        data.projectsBidStatusDroppedAfterFeasibility.maxValue += project.maxValue;
                    } else if (project.bidManagerStatus === BidManagerStatus.Awarded) {
                        data.projectsBidStatusAwarded.count += 1;
                        data.projectsBidStatusAwarded.maxValue += project.maxValue;
                    } else if (project.bidManagerStatus === BidManagerStatus.NotAwarded) {
                        data.projectsBidStatusNotAwarded.count += 1;
                        data.projectsBidStatusNotAwarded.maxValue += project.maxValue;
                    } else if (project.bidManagerStatus === BidManagerStatus.ToAction) {
                        data.projectsBidStatusToAction.count += 1;
                        data.projectsBidStatusToAction.maxValue += project.maxValue;
                    } else if (project.bidManagerStatus === BidManagerStatus.Nosuppliermatched) {
                        data.projectsBidStatusNosuppliermatched.count += 1;
                        data.projectsBidStatusNosuppliermatched.maxValue += project.maxValue;
                    } else if (project.bidManagerStatus === BidManagerStatus.GoNoGoStage1) {
                        data.projectsBidStatusGoNoGoStage1.count += 1;
                        data.projectsBidStatusGoNoGoStage1.maxValue += project.maxValue;
                    } else if (project.bidManagerStatus === BidManagerStatus.SupplierConfirmation) {
                        data.projectsBidStatusSupplierConfirmation.count += 1;
                        data.projectsBidStatusSupplierConfirmation.maxValue += project.maxValue;
                    } else if (project.bidManagerStatus === BidManagerStatus.GoNoGoStage2) {
                        data.projectsBidStatusGoNoGoStage2.count += 1;
                        data.projectsBidStatusGoNoGoStage2.maxValue += project.maxValue;
                    }

                    // if (project.category.length) {
                    //     project.category.forEach((category: any) => {
                    //         if (data.categoryWise[category]) {
                    //             data.categoryWise[category]++;
                    //         } else {
                    //             data.categoryWise[category] = 1;
                    //         }
                    //     });
                    // }
                    if (project.category.some((category: string) => uniqueCategories.includes(category))) {
                        data.projectsMatched.count += 1;
                        data.projectsMatched.maxValue += project.maxValue;
                    }
                    if (project.projectType.length > 0) {
                        project.projectType.forEach((type: any) => {
                            const key = !type || type.trim() === "" ? "Unknown ProjectType" : type; // Handle null, undefined, ""

                            if (data.projectTypeWise.hasOwnProperty(key)) {
                                data.projectTypeWise[key]++;
                            } else {
                                data.projectTypeWise[key] = 1;
                            }
                        });
                    } else {
                        if (!data.projectTypeWise["Unknown ProjectType"]) {
                            data.projectTypeWise["Unknown ProjectType"] = 0;
                        }
                    }
                }
                if (project.categorisation === "DPS") {
                    data.categorisationWise["DPS"]++
                } else if (project.categorisation === "Framework") {
                    data.categorisationWise["Framework"]++;
                    //data.categorisationWise["Framework"] = (data.categorisationWise["Framework"] || 0) + 1; // check if key is exists
                } else if (project.categorisation === "DTD") {
                    data.categorisationWise["DTD"]++
                } else if (project.categorisation === "") {
                    if (data.categorisationWise["Unknown Category"]) {
                        data.categorisationWise["Unknown Category"]++
                    } else {
                        data.categorisationWise["Unknown Category"] = 1;
                    }
                }

            }
        })

        Object.keys(data.projectTypeWise).forEach((key) => {
            if (data.projectTypeWise[key] === 0) delete data.projectTypeWise[key];
        });

        Object.keys(data.categorisationWise).forEach((key) => {
            if (data.categorisationWise[key] === 0) delete data.categorisationWise[key];
        });
        data.categorisationWise["DPS"] = Object.values(obj)?.reduce((acc: any, curr: any) => (acc + curr), 0) || data.categorisationWise["DPS"];
        data.categorisationWise["Framework"] = Object.values(obj)?.reduce((acc: any, curr: any) => (acc + curr), 0) || data.categorisationWise["Framework"];

        return res.status(200).json({
            message: "Admin dashboard data fetch success",
            status: true,
            data: data
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

export const getAdminDashboardSuppliersStatistics = async (req: any, res: Response) => {
    try {
        const { supplierId } = req.query;

        const today = new Date();

        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - 6);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        let aggregationPipeline: any[] = [
            {
                $match: {
                    status: projectStatus.Won,
                    closedDate: { $gte: lastWeekStart, $lte: endOfDay }
                }
            }
        ];

        if (supplierId) {
            aggregationPipeline.push({
                $match: {
                    select: {
                        $elemMatch: {
                            supplierId: new mongoose.Types.ObjectId(supplierId)
                        }
                    }
                }
            });
        }

        const data: any = await projectModel.aggregate(aggregationPipeline);

        const groupedData: any = {};
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(lastWeekStart);
            currentDate.setDate(lastWeekStart.getDate() + i);
            const formattedDate = currentDate.toISOString().split('T')[0];
            const formattedDay = getDayName(currentDate.getDay());
            groupedData[formattedDate] = {
                day: formattedDay,
                data: data.filter((item: any) => item.closedDate.toISOString().split('T')[0] === formattedDate).length
            };
        }

        return res.status(200).json({
            message: "Admin dashboard data fetch success",
            status: true,
            data: groupedData
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

function getDayName(day: any) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
}

export const connectUserToSocket = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        console.log(userId);
        connectUser(userId);
        res.status(200).json({
            message: 'User connected to socket',
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

export const GetUserLogin = async (req: any, res: Response) => {
    try {
        const userId = req.params.id;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const rawData = await LoginModel.find({
            userId,
            createdAt: { $gte: oneWeekAgo, $lte: today },
        }).sort({ createdAt: -1 });;

        const formattedData = rawData.map((record: any) => {
            const time = new Date(record.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Kolkata",
            });
            return { loginTime: time, ...record.toObject() };
        });

        return res.status(200).json({
            message: "Day-wise login data fetched successfully",
            status: true,
            data: formattedData,
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null,
        });
    }
};

export const fetchSupplierWithProjectStatus = async (req: any, res: Response) => {
    try {
        const { supplierId, status } = req.query;

        const allowedStatuses = ["InSolution", "WaitingForResult", "Awarded", "NotAwarded"];
        const selectedStatus = status?.toString() || null;

        if (!supplierId) {
            return res.status(400).json({
                message: "Supplier ID is required",
                status: false
            });
        }

        if (selectedStatus && !allowedStatuses.includes(selectedStatus)) {
            return res.status(400).json({
                message: `Invalid status. Allowed values are: ${allowedStatuses.join(", ")}`,
                status: false
            });
        }

        const supplier = await userModel.findById(supplierId).lean();

        if (!supplier) {
            return res.status(404).json({
                message: "Supplier not found",
                status: false
            });
        }

        // Fetch all relevant projects
        const allProjects = await projectModel.find({
            selectedUserIds: {
                $elemMatch: {
                    userId: supplierId,
                    isSelected: true
                }
            }
        });

        // Filter projects by selected status (if provided)
        const filteredProjects = selectedStatus
            ? allProjects.filter(p => p.bidManagerStatus === selectedStatus)
            : allProjects;

        const sortProjects = await projectModel.find({
            sortListUserId: { $in: supplierId }
        });

        // Count projects by status
        const projectStatusCounts: any = {
            InSolution: 0,
            WaitingForResult: 0,
            Awarded: 0,
            NotAwarded: 0,
            SortListed: sortProjects.length
        };

        allProjects.forEach(project => {
            const status = project.bidManagerStatus;
            if (allowedStatuses.includes(status)) {
                projectStatusCounts[status]++;
            }
        });

        return res.status(200).json({
            message: "Supplier with projects fetched successfully",
            status: true,
            data: {
                supplier,
                totalAssignedProjects: filteredProjects.length,
                assignedProjects: filteredProjects,
                projectStatusCounts
            }
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
};






