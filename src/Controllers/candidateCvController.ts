import { Request, Response } from "express"
import CandidateCvModel from "../Models/candidateCv"
import userModel from "../Models/userModel"
import RoleModel from "../Models/roleModel"
import CandidateFilter from "../Models/candidateFilter"
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
            .populate("currentRole", "name")
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

        const candidate = await CandidateCvModel.findById(id).populate("roleId",  ["name", "otherRole"]).populate("currentRole", "name");
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
            {
                $lookup: {
                    from: "roles",
                    localField: "currentRole",
                    foreignField: "_id",
                    as: "currentRoleData",
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

export const getCandidates = async (req: any, res: Response) => {
    try {
        const { search, roleSearch } = req.query;

        const pipeline: any[] = [
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleIdData",
                },
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "currentRole",
                    foreignField: "_id",
                    as: "currentRoleData",
                },
            }
        ];

        // Build match conditions array
        const matchConditions: any[] = [];

        // Add fullName search condition if provided
        if (search) {
            matchConditions.push({
                fullName: { $regex: search, $options: "i" }
            });
        }

        // Add role search condition if provided
        if (roleSearch) {
            const regex = new RegExp(roleSearch, "i");

            matchConditions.push({
                $or: [
                    { "roleIdData.name": { $regex: regex } },
                    { "roleIdData.otherRoles": { $elemMatch: { $regex: regex } } },
                    { "currentRoleData.name": { $regex: regex } },
                    { "currentRoleData.otherRoles": { $elemMatch: { $regex: regex } } }
                ]
            });
        }

        // Add match stage to pipeline if any search conditions exist
        if (matchConditions.length > 0) {
            pipeline.push({
                $match: {
                    $and: matchConditions
                }
            });
        }

        // Get count for pagination
        const countPipeline = [...pipeline, { $count: "count" }];
        const [{ count = 0 } = {}] = await CandidateCvModel.aggregate(countPipeline);

        // Add sorting, pagination, and field formatting
        pipeline.push(
            {
                $addFields: {
                    inactiveLogs: {
                        $sortArray: {
                            input: "$inactiveLogs",
                            sortBy: { inactiveDate: -1 }
                        }
                    },
                    // Keep roleId and currentRole in the expected format
                    roleId: "$roleIdData",
                    currentRole: { $arrayElemAt: ["$currentRoleData", 0] }
                }
            },
            {
                $project: {
                    roleIdData: 0,
                    currentRoleData: 0
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
            data: candidates,
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

// not used 
export const getCandidateFilters = async (req: any, res: Response) => {
    try {
        // Get all unique roles from candidates
        const rolesData = await CandidateCvModel.aggregate([
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleData"
                }
            },
            {
                $unwind: "$roleData"
            },
            {
                $group: {
                    _id: "$roleData._id",
                    name: { $first: "$roleData.name" },
                    otherRole: { $first: "$roleData.otherRole" },
                    candidateCount: { $sum: 1 }
                }
            },
            {
                $sort: { candidateCount: -1, name: 1 }
            }
        ]);

        // Get experience ranges
        const experienceRanges = [
            { label: "0-1 years", min: 0, max: 1 },
            { label: "1-3 years", min: 1, max: 3 },
            { label: "3-5 years", min: 3, max: 5 },
            { label: "5-8 years", min: 5, max: 8 },
            { label: "8-12 years", min: 8, max: 12 },
            { label: "12+ years", min: 12, max: 999 }
        ];

        // Get candidate count for each experience range
        const experienceData = await Promise.all(
            experienceRanges.map(async (range) => {
                const count = await CandidateCvModel.countDocuments({
                    totalExperience: {
                        $gte: range.min,
                        ...(range.max !== 999 ? { $lt: range.max } : {})
                    },
                    active: true
                });
                return {
                    ...range,
                    candidateCount: count
                };
            })
        );

        return res.status(200).json({
            message: "Candidate filters fetched successfully",
            status: true,
            data: {
                roles: rolesData,
                experienceRanges: experienceData
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Error fetching candidate filters",
            status: false,
            error: error.message
        });
    }
};

// no use
export const getCandidatesByFilters = async (req: any, res: Response) => {
    try {
        const { roleIds, minExperience, maxExperience, active } = req.query;

        // Build aggregation pipeline
        const pipeline: any[] = [
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleData"
                }
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "currentRole",
                    foreignField: "_id",
                    as: "currentRoleData"
                }
            }
        ];

        // Build match conditions
        const matchConditions: any = {};

        // Filter by active status (default to true)
        if (active !== undefined) {
            matchConditions.active = active === 'true';
        } else {
            matchConditions.active = true; // Default to active candidates
        }

        // Filter by roles if provided
        if (roleIds) {
            const roleIdArray = Array.isArray(roleIds) ? roleIds : roleIds.split(',');
            const objectIdArray = roleIdArray.map((id: string) => new mongoose.Types.ObjectId(id.trim()));
            matchConditions.roleId = { $in: objectIdArray };
        }

        // Filter by experience range if provided
        if (minExperience !== undefined || maxExperience !== undefined) {
            matchConditions.totalExperience = {};
            if (minExperience !== undefined) {
                matchConditions.totalExperience.$gte = parseInt(minExperience);
            }
            if (maxExperience !== undefined && maxExperience !== '999') {
                matchConditions.totalExperience.$lt = parseInt(maxExperience);
            }
        }

        // Add match stage
        pipeline.push({ $match: matchConditions });

        // Get count for pagination
        const countPipeline = [...pipeline, { $count: "count" }];
        const [{ count = 0 } = {}] = await CandidateCvModel.aggregate(countPipeline);

        // Add formatting and pagination
        pipeline.push(
            {
                $addFields: {
                    inactiveLogs: {
                        $sortArray: {
                            input: "$inactiveLogs",
                            sortBy: { inactiveDate: -1 }
                        }
                    },
                    roleId: "$roleData",
                    currentRole: { $arrayElemAt: ["$currentRoleData", 0] }
                }
            },
            {
                $project: {
                    roleData: 0,
                    currentRoleData: 0
                }
            },
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: req.pagination?.skip || 0 },
            { $limit: req.pagination?.limit || 10 }
        );

        const candidates = await CandidateCvModel.aggregate(pipeline);

        const [executiveCount, activeCandidatesCount] = await Promise.all([
            CandidateCvModel.countDocuments({ executive: true }),
            CandidateCvModel.countDocuments({ active: true })
        ]);

        return res.status(200).json({
            message: "Filtered candidates fetched successfully",
            status: true,
            data: candidates,
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
            message: "Error fetching filtered candidates",
            status: false,
            error: error.message
        });
    }
};

// Save a new candidate filter
export const saveCandidateFilter = async (req: any, res: Response) => {
    try {
        const { jobTitle, minExperience, maxExperience } = req.body;
        const userId = req.user.id;

        if (!jobTitle) {
            return res.status(400).json({
                message: "jobTitle is required",
                status: false
            });
        }

        const existingFilter = await CandidateFilter.findOne({
            userId,
            jobTitle: { $regex: new RegExp(`^${jobTitle}$`, 'i') }
        });

        if (existingFilter) {
            return res.status(400).json({
                message: "Job title already exists. Please choose a different name.",
                status: false
            });
        }

        const candidateCount = await CandidateCvModel.aggregate([
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleData"
                }
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "currentRole",
                    foreignField: "_id",
                    as: "currentRoleData"
                }
            },
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { "roleData.name": { $regex: jobTitle, $options: "i" } },
                                { "roleData.otherRole": { $regex: jobTitle, $options: "i" } },
                                { "currentRoleData.name": { $regex: jobTitle, $options: "i" } },
                                { "currentRoleData.otherRole": { $regex: jobTitle, $options: "i" } }
                            ]
                        },
                        {
                            totalExperience: {
                                $gte: minExperience,
                                ...(maxExperience !== 999 ? { $lt: maxExperience } : {})
                            }
                        },
                        { active: true }
                    ]
                }
            },
            { $count: "count" }
        ]);

        const count = candidateCount.length > 0 ? candidateCount[0].count : 0;

        const newFilter = new CandidateFilter({
            userId,
            jobTitle,
            minExperience,
            maxExperience,
            candidateCount: count
        });

        const savedFilter = await newFilter.save();

        return res.status(201).json({
            message: "Filter saved successfully",
            status: true,
            data: savedFilter
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Error saving filter",
            status: false,
            error: error.message
        });
    }
};

// Get list of saved filters
export const getRoleList = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { search } = req.query;

        const query: any = { userId, active: true };

        if (search) {
            query.$or = [
                { jobTitle: { $regex: search, $options: "i" } }
            ];
        }

        const filters = await CandidateFilter.find(query)
            .sort({ createdAt: -1 });

        const updatedFilters = await Promise.all(
            filters.map(async (filter) => {
                // Count candidates matching this filter using aggregation to search in role names
                const candidateCount = await CandidateCvModel.aggregate([
                    {
                        $lookup: {
                            from: "roles",
                            localField: "roleId",
                            foreignField: "_id",
                            as: "roleData"
                        }
                    },
                    {
                        $lookup: {
                            from: "roles",
                            localField: "currentRole",
                            foreignField: "_id",
                            as: "currentRoleData"
                        }
                    },
                    {
                        $match: {
                            $and: [
                                {
                                    $or: [
                                        { "roleData.name": { $regex: filter.jobTitle, $options: "i" } },
                                        { "roleData.otherRole": { $regex: filter.jobTitle, $options: "i" } },
                                        { "currentRoleData.name": { $regex: filter.jobTitle, $options: "i" } },
                                        { "currentRoleData.otherRole": { $regex: filter.jobTitle, $options: "i" } }
                                    ]
                                },
                                {
                                    totalExperience: {
                                        $gte: filter.minExperience,
                                        ...(filter.maxExperience !== 999 ? { $lt: filter.maxExperience } : {})
                                    }
                                },
                                { active: true }
                            ]
                        }
                    },
                    { $count: "count" }
                ]);

                const count = candidateCount.length > 0 ? candidateCount[0].count : 0;

                if (count !== filter.candidateCount) {
                    await CandidateFilter.findByIdAndUpdate(filter._id, { candidateCount: count });
                }

                return {
                    ...filter.toObject(),
                    candidateCount: count
                };
            })
        );

        return res.status(200).json({
            message: "Role filters fetched successfully",
            status: true,
            data: updatedFilters
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Error fetching role filters",
            status: false,
            error: error.message
        });
    }
};

// Get candidates by saved filter ID
export const getCandidatesByFilterId = async (req: any, res: Response) => {
    try {
        const { filterId } = req.params;
        const userId = req.user.id;

        // Get the saved filter
        const filter = await CandidateFilter.findOne({
            _id: filterId,
            userId,
            active: true
        });

        if (!filter) {
            return res.status(404).json({
                message: "Filter not found",
                status: false
            });
        }

        const pipeline: any[] = [
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "roleData"
                }
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "currentRole",
                    foreignField: "_id",
                    as: "currentRoleData"
                }
            },
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { "roleData.name": { $regex: filter.jobTitle, $options: "i" } },
                                { "roleData.otherRole": { $regex: filter.jobTitle, $options: "i" } },
                                { "currentRoleData.name": { $regex: filter.jobTitle, $options: "i" } },
                                { "currentRoleData.otherRole": { $regex: filter.jobTitle, $options: "i" } }
                            ]
                        },
                        // {
                        //     totalExperience: {
                        //         $gte: filter.minExperience,
                        //         ...(filter.maxExperience !== 999 ? { $lt: filter.maxExperience } : {})
                        //     }
                        // },
                        { active: true }
                    ]
                }
            }
        ];

        // Get count for pagination
        const countPipeline = [...pipeline, { $count: "count" }];
        const [{ count = 0 } = {}] = await CandidateCvModel.aggregate(countPipeline);

        pipeline.push(
            {
                $addFields: {
                    inactiveLogs: {
                        $sortArray: {
                            input: "$inactiveLogs",
                            sortBy: { inactiveDate: -1 }
                        }
                    },
                    roleId: "$roleData",
                    currentRole: { $arrayElemAt: ["$currentRoleData", 0] }
                }
            },
            {
                $project: {
                    roleData: 0,
                    currentRoleData: 0
                }
            },
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: req.pagination?.skip || 0 },
            { $limit: req.pagination?.limit || 10 }
        );

        const candidates = await CandidateCvModel.aggregate(pipeline);

        return res.status(200).json({
            message: "Candidates fetched successfully",
            status: true,
            data: candidates,
            filter: {
                _id: filter._id,
                jobTitle: filter.jobTitle,
                minExperience: filter.minExperience,
                maxExperience: filter.maxExperience,
                candidateCount: count
            },
            meta_data: {
                page: req.pagination?.page,
                items: count,
                page_size: req.pagination?.limit,
                pages: Math.ceil(count / (req.pagination?.limit as number))
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Error fetching candidates by filter",
            status: false,
            error: error.message
        });
    }
};

// Delete a saved filter
export const deleteCandidateFilter = async (req: any, res: Response) => {
    try {
        const { filterId } = req.params;
        const userId = req.user.id;

        const deletedFilter = await CandidateFilter.findOneAndDelete({
            _id: filterId,
            userId
        });

        if (!deletedFilter) {
            return res.status(404).json({
                message: "Filter not found",
                status: false
            });
        }

        return res.status(200).json({
            message: "Filter deleted successfully",
            status: true
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Error deleting filter",
            status: false,
            error: error.message
        });
    }
};