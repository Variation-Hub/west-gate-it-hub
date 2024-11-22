import { Request, Response } from "express"
import userModel from "../Models/userModel"
import { generateToken } from "../Util/JwtAuth"
import { comparepassword } from "../Util/bcrypt"
import { generatePass, projectCategory, projectStatus, userRoles } from "../Util/contant"
import { emailHelper } from "../Util/nodemailer"
import { deleteFromBackblazeB2, uploadToBackblazeB2 } from "../Util/aws"
import projectModel from "../Models/projectModel"
import mongoose, { Schema } from "mongoose"
import { connectUser } from "../socket/socketEvent"
import LoginModel from "../Models/LoginModel"
import caseStudy from "../Models/caseStudy"

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
                message: user.activeStatus,
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

export const updateUser = async (req: Request, res: Response) => {
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
        const deleteUser = await userModel.findByIdAndDelete(id);

        if (!deleteUser) {
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
        if (!(await comparepassword(oldPassword, user.password))) {
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
            .skip(req.pagination?.skip as number);


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

        const count = await userModel.countDocuments({ role: userRoles.SupplierAdmin })

        const user = await userModel.find(
            { role: userRoles.SupplierAdmin })
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number);


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

export const getUserList = async (req: any, res: Response) => {
    try {

        const userRoles = (req.query.userRoles).split(",");
        const projectCount = (req.query.projectCount);
        const projectId = req.query.projectId;

        if (projectId) {
            const project = await projectModel.findById(projectId);

            const casestudy = await caseStudy.find({ category: project?.category });

            const userIds = casestudy.map((caseItem) => caseItem.userId);

            const users = await userModel.find({ _id: { $in: userIds } });

            return res.status(200).json({
                message: "User list fetch success",
                status: true,
                data: users
            });
        }

        let users: any = await userModel.find({ role: { $in: userRoles } }).select({ password: 0 });

        if (projectCount) {
            const result = await projectModel.aggregate([
                { $unwind: "$select" },
                { $group: { _id: "$select.supplierId", count: { $sum: 1 } } },
                { $project: { _id: 0, supplierId: "$_id", projectCount: "$count" } }
            ]);

            users = users.map((user: any) => {
                console.log(result, user._id)
                const supplierCount = result.find((item) => new mongoose.Types.ObjectId(item.supplierId).equals(user._id));
                if (supplierCount) {
                    return {
                        ...user.toObject(),
                        projectCount: supplierCount.projectCount
                    };
                } else {
                    return {
                        ...user.toObject(),
                        projectCount: 0
                    };
                }
            });
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
        const { duration, startDate, endDate } = req.query;

        let createdAtFilter = {};

        if (duration) {
            if (duration === "yearly") {
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();
                const startOfYear = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0)); // Start of the year in UTC
                const currentIST = new Date(currentDate.getTime() + 5.5 * 60 * 60 * 1000); // Adjust to IST
                createdAtFilter = {
                    createdAt: {
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
                    createdAt: {
                        $gte: new Date(startOfWeek.getTime() + 5.5 * 60 * 60 * 1000), // Adjust to IST
                        $lt: currentIST
                    }
                };
            } else if (duration === "monthly") {
                const currentDate = new Date();
                const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const currentIST = new Date(currentDate.getTime() + 5.5 * 60 * 60 * 1000); // Adjust to IST
                createdAtFilter = {
                    createdAt: {
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
                    createdAt: {
                        $gte: new Date(startOfDay.getTime() + 5.5 * 60 * 60 * 1000), // Adjust to IST
                        $lt: currentIST
                    }
                };
            }

        } else if (startDate && endDate) {
            createdAtFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const projects = await projectModel.find(createdAtFilter).select({ status: 1, maxValue: 1, category: 1 });
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
            projectsInSolution: {
                count: 0,
                maxValue: 0
            },
            projectsInSubmission: {
                count: 0,
                maxValue: 0
            },
            projectsInReview: {
                count: 0,
                maxValue: 0
            },
            TotalSubmitted: {
                count: 0,
                maxValue: 0
            },
            projectsAwarded: {
                count: 0,
                maxValue: 0
            },
            projectsNotAwarded: {
                count: 0,
                maxValue: 0
            },
            categoryWise: {}
        };

        // const uniqueCategories = await userModel.distinct("categoryList");
        const uniqueCategories = await caseStudy.distinct("category");
        // const projectCategory = await projectModel.distinct("category");

        projects.forEach((project: any) => {
            data.projectsPosted.maxValue += project.maxValue;
            if (project.status === projectStatus.Won) {
                data.projectsClosed.count += 1;
                data.projectsClosed.maxValue += project.maxValue;
            } else if (project.status === projectStatus.InSolution) {
                data.projectsInSolution.count += 1;
                data.projectsInSolution.maxValue += project.maxValue;
            } else if (project.status === projectStatus.InSubmission) {
                data.projectsInSubmission.count += 1;
                data.projectsInSubmission.maxValue += project.maxValue;
            } else if (project.status === projectStatus.InReviewWestGate) {
                data.projectsInReview.count += 1;
                data.projectsInReview.maxValue += project.maxValue;
            } else if (project.status === projectStatus.Submitted) {
                data.TotalSubmitted.count += 1;
                data.TotalSubmitted.maxValue += project.maxValue;
            } else if (project.status === projectStatus.Awarded) {
                data.projectsAwarded.count += 1;
                data.projectsAwarded.maxValue += project.maxValue;
            } else if (project.status === projectStatus.NotAwarded) {
                data.projectsNotAwarded.count += 1;
                data.projectsNotAwarded.maxValue += project.maxValue;
            }

            if (project.category === projectCategory.WebDevelopment) {
                data.categoryWise.WebDevelopment += 1;
            } else if (project.category === projectCategory.Testing) {
                data.categoryWise.Testing += 1;
            } else if (project.category === projectCategory.DataBase) {
                data.categoryWise.DataBase += 1;
            } else if (project.category === projectCategory.Andoid) {
                data.categoryWise.Andoid += 1;
            } else if (project.category === projectCategory.ArtificialIntelligence) {
                data.categoryWise.ArtificialIntelligence += 1;
            }

            if (project.category) {
                if (data.categoryWise[project.category]) {
                    data.categoryWise[project.category]++;
                } else {
                    data.categoryWise[project.category] = 1;
                }
            }

            if (uniqueCategories.includes(project.category)) {
                data.projectsMatched.count += 1;
                data.projectsMatched.maxValue += project.maxValue;
            }
        })

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

        const daysInRange = [];
        const startDate = new Date();
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

        return res.status(200).json({
            message: "Day-wise login data fetched successfully",
            status: true,
            data: groupedData,
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null,
        });
    }
};
