import { Request, Response } from "express"
import CandidateCvModel from "../Models/candidateCv"
import userModel from "../Models/userModel"
import RoleModel from "../Models/roleModel"
import mongoose from "mongoose";

export const createCandidateCV = async (req: any, res: Response) => {
    try {
        const { data } = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: "Invalid data format", status: false });
        }

        for (const candidate of data) {
            if (!Array.isArray(candidate.roleId)) {
                throw new Error("roleId must be an array");
            }

            if (candidate.ukDayRate && candidate.ukDayRate >= 250) {
                candidate.executive = true;
            } else {
                candidate.executive = false;
            }

            const processedRoleIds = [];
            for (let i = 0; i < candidate.roleId.length; i++) {
                const roleId = candidate.roleId[i];

                // If roleId is a valid ObjectId, check if it exists
                if (mongoose.Types.ObjectId.isValid(roleId)) {
                    const existingRole = await RoleModel.findById(roleId);

                    if (existingRole) {
                        processedRoleIds.push(roleId);
                    } else {
                        const newRole = await RoleModel.create({
                            name: `Role ${roleId}`,
                            otherRoles: []
                        });
                        processedRoleIds.push(newRole._id);
                    }
                }
                // If roleId is a string
                else if (typeof roleId === 'string') {
                    let existingRole = await RoleModel.findOne({ name: roleId });

                    if (!existingRole) {
                        existingRole = await RoleModel.create({
                            name: roleId,
                            otherRoles: []
                        });
                    }

                    processedRoleIds.push(existingRole._id);
                }
            }

            candidate.roleId = processedRoleIds;
        }

        const candidates = await CandidateCvModel.insertMany(data);

        return res.status(201).json({
            message: "Candidates added successfully",
            status: true,
            data: candidates,
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message, status: false });
    }
};

export const getAllCandidates = async (req: any, res: Response) => {
    try {
        const { search } = req.query;

        const queryObj: any = {}; 

        if (search) {
            queryObj["fullName"] = { $regex: search, $options: "i" };
        }

        const count = await CandidateCvModel.countDocuments(queryObj);

        const [executiveCount, activeCandidatesCount] = await Promise.all([
            CandidateCvModel.countDocuments({ executive: true }),
            CandidateCvModel.countDocuments({ active: true })
        ]);

        const candidates = await CandidateCvModel.find(queryObj)
            .populate("roleId",  ["name", "otherRole"])
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number)
            .sort({ createdAt: -1, _id: -1 });

        const candidatesWithSortedLogs = candidates.map(candidate => {
            const sortedInactiveLogs = candidate.inactiveLogs?.sort(
                (a: any, b: any) => new Date(b.inactiveDate).getTime() - new Date(a.inactiveDate).getTime()
            );
            
                return {
                    ...candidate.toObject(),
                    inactiveLogs: sortedInactiveLogs
                };
            });

        return res.status(200).json({
            message: "Candidates successfully fetched",
            status: true,
            data: candidatesWithSortedLogs,
            executiveCount: executiveCount,
            activeCandidatesCount: activeCandidatesCount,
            meta_data: {
                page: req.pagination?.page,
                items: count,
                page_size: req.pagination?.limit,
                pages: Math.ceil(count / (req.pagination?.limit as number))
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Error fetching candidates",
            status: false,
            error: error.message
        });
    }
};

export const getCandidateById = async (req: any, res: Response) => {
    try {
        const { id } = req.params;

        const candidate = await CandidateCvModel.findById(id).populate("roleId",  ["name", "otherRole"]);
        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found", status: false });
        }

        const sortedInactiveLogs = candidate.inactiveLogs?.sort(
            (a: any, b: any) => new Date(b.inactiveDate).getTime() - new Date(a.inactiveDate).getTime()
        );
        return res.status(200).json({
            message: "Candidate fetched successfully",
            status: true,
            data: {
                ...candidate.toObject(),
                inactiveLogs: sortedInactiveLogs
            }
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message, status: false });
    }
};

export const updateCandidate = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { data } = req.body;

        if (!data || typeof data !== "object") {
            return res.status(400).json({ message: "Invalid data format", status: false });
        }

        const existingCandidate = await CandidateCvModel.findById(id);
        if (!existingCandidate) {
            return res.status(404).json({ message: "Candidate not found", status: false });
        }
        
        if (data.roleId && !Array.isArray(data.roleId)) {
            return res.status(400).json({ message: "roleId must be an array", status: false });
        }

        if (data.active === false) {
            if (!data.inactiveComment) {
                return res.status(400).json({ message: "Inactive comment is required", status: false });
            }
            data.inactiveDate = new Date();
            data.inactiveLogs = [
                ...(existingCandidate.inactiveLogs || []),
                { inactiveComment: data.inactiveComment, inactiveDate: data.inactiveDate }
            ];
        }

        if (data.active === true) {
            const supplier = await userModel.findById(existingCandidate.supplierId);
            console.log(supplier?._id, supplier?.active)
            if (!supplier || supplier.active === false) {
                return res.status(400).json({
                    message: "Cannot activate candidate because the supplier is inactive",
                    status: false,
                    data: null
                });
            }
        }

        if (data.ukDayRate !== undefined) {
            data.executive = data.ukDayRate >= 250;
        }

        const updatedCandidate = await CandidateCvModel.findByIdAndUpdate(id, data, { new: true });

        if (!updatedCandidate) {
            return res.status(404).json({ message: "Candidate not found", status: false });
        }

        return res.status(200).json({
            message: "Candidate updated successfully",
            status: true,
            data: updatedCandidate,
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message, status: false });
    }
};

export const deleteCandidate = async (req: any, res: Response) => {
    try {
        const { id } = req.params;

        const deletedCandidate = await CandidateCvModel.findByIdAndDelete(id);
        if (!deletedCandidate) {
            return res.status(404).json({ message: "Candidate not found", status: false });
        }

        return res.status(200).json({
            message: "Candidate deleted successfully",
            status: true,
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message, status: false });
    }
};

export const getCandidatesBySupplierId = async (req: any, res: Response) => {
    try {
        const { supplierId } = req.params;
        const { startDate, endDate, role, executive } = req.query;
        if (!supplierId) {
            return res.status(400).json({
                message: "Supplier ID is required",
                status: false,
            });
        }

        const matchStage: any = {
            supplierId: new mongoose.Types.ObjectId(supplierId),
        };

        const dateFilter: any = { supplierId: new mongoose.Types.ObjectId(supplierId) };
        

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchStage.createdAt = { $gte: start, $lte: end };
            dateFilter.createdAt = { $gte: start, $lte: end };
        }

        if (executive == 'true') {
            matchStage["executive"] = true;
        } else if (executive == "false") {
            matchStage["executive"] = false;
        }

        const pipeline: any[] = [
            {
                $match: matchStage,
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleId",
                },
            },
        ];

        if (role) {
            pipeline.push({
                $match: {
                    "roleId.name": {
                        $regex: role,
                        $options: "i",
                    },
                },
            });
        }

        const countPipeline = [...pipeline, { $count: "count" }];
        const [{ count = 0 } = {}] = await CandidateCvModel.aggregate(countPipeline);

        const [executiveCount, activeCandidatesCount] = await Promise.all([
            CandidateCvModel.countDocuments({
                ...dateFilter,
                executive: true,
            }),
            CandidateCvModel.countDocuments({
                ...dateFilter,
                active: true,
            }),
        ]);

        pipeline.push(
            {
                $addFields: {
                    inactiveLogs: {
                        $sortArray: {
                            input: "$inactiveLogs",
                            sortBy: { inactiveDate: -1 }
                        }
                    }
                }
            },
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: req.pagination?.skip || 0 },
            { $limit: req.pagination?.limit || 10 }
        );

        const candidates = await CandidateCvModel.aggregate(pipeline);

        return res.status(200).json({
            message: "Candidates successfully fetched",
            status: true,
            data: {
                data: candidates,
                executiveCount,
                activeCandidatesCount,
                meta_data: {
                    page: req.pagination?.page,
                    items: count,
                    page_size: req.pagination?.limit,
                    pages: Math.ceil(count / (req.pagination?.limit as number)),
                },
            },
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Error fetching candidates",
            status: false,
            error: error.message,
        });
    }
};
  