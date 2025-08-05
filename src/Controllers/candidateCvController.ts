import { Request, Response } from "express"
import CandidateCvModel from "../Models/candidateCv"
import userModel from "../Models/userModel"
import RoleModel from "../Models/roleModel"
import CandidateFilter from "../Models/candidateFilter"
import mongoose from "mongoose";
import { findRoleByName } from "./roleController";

const normalizeName = (name: string): string => {
  return name
    .replace(/\s+/g, ' ')        // replace multiple spaces with single
    .replace(/\s+\(/g, '(')      // remove space before (
    .replace(/\(\s+/g, '(')      // remove space after (
    .replace(/\s+\)/g, ')')      // remove space before )
    .trim();              // remove trailing spaces
};

export const createCandidateCV = async (req: any, res: Response) => {
    try {
        const { data } = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: "Invalid data format", status: false });
        }

        const roleCache = new Map<string, any>();

        const getRoleInfo = async (name: string) => {
            const normalized = normalizeName(name);
            const cacheKey = normalized.toLowerCase();
            if (roleCache.has(cacheKey)) return roleCache.get(cacheKey);

            let roleInfo = await findRoleByName(normalized);
            // No longer create new roles - return null if role doesn't exist

            roleCache.set(cacheKey, roleInfo);
            return roleInfo;
        };

        const skippedCandidates: any[] = [];

        for (const candidate of data) {
            if (!Array.isArray(candidate.roleId)) {
                throw new Error("roleId must be an array");
            }

            candidate.executive = candidate.ukDayRate && candidate.ukDayRate >= 250;

            const processedRoleIds: mongoose.Types.ObjectId[] = [];
            let invalidRole = false;

            for (let i = 0; i < candidate.roleId.length; i++) {
                const roleId = candidate.roleId[i];

                if (mongoose.Types.ObjectId.isValid(roleId)) {
                    const existingRole = await RoleModel.findById(roleId).lean();
                    if (existingRole) {
                        processedRoleIds.push(existingRole._id);
                    } else {
                        invalidRole = true;
                    }
                } else if (typeof roleId === 'string') {
                    const roleInfo = await getRoleInfo(roleId);
                    if (roleInfo) {
                        processedRoleIds.push(roleInfo.roleId);
                    } else {
                        invalidRole = true;
                    }
                }
            }

            if (invalidRole) {
                skippedCandidates.push(candidate);
                continue;
            }

            candidate.roleId = processedRoleIds;

            const rawCurrentRole = candidate.currentRole;

            if (rawCurrentRole) {
                const trimmedRole = normalizeName(rawCurrentRole);

                if (mongoose.Types.ObjectId.isValid(trimmedRole)) {
                    const existingRole = await RoleModel.findById(trimmedRole).lean();
                    if (existingRole) {
                        candidate.currentRole = existingRole._id;
                    } else {
                        skippedCandidates.push(candidate);
                        continue;
                    }
                } else {
                    const roleInfo = await getRoleInfo(trimmedRole);
                    if (roleInfo) {
                        candidate.currentRole = roleInfo.roleId;
                    } else {
                        // Skip candidate if currentRole doesn't exist in DB
                        skippedCandidates.push(candidate);
                        continue;
                    }
                }
            } else {
                candidate.currentRole = null;
            }

            if (candidate.uniqueId) {
                const existingCandidate = await CandidateCvModel.findOne({ uniqueId: candidate.uniqueId });
                if (existingCandidate) {
                    await CandidateCvModel.findByIdAndUpdate(existingCandidate._id, candidate, { new: true });
                    continue;
                }
            }

            await new CandidateCvModel(candidate).save();
        }

        return res.status(201).json({
            message: "Candidates saved successfully",
            status: true,
            skippedCandidates: skippedCandidates
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
            .populate("roleId", ["name", "type", "parentRoleId", "otherRoles"])
            .populate("currentRole", ["name", "type", "parentRoleId"])
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
            message: "Candidates fetched successfully",
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

        const candidate = await CandidateCvModel.findById(id)
            .populate("roleId", ["name", "type", "parentRoleId", "otherRoles"])
            .populate("currentRole", ["name", "type", "parentRoleId"]);
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

        if (data.roleId && Array.isArray(data.roleId)) {
            const processedRoleIds = [];
            for (const roleId of data.roleId) {
                if (mongoose.Types.ObjectId.isValid(roleId)) {
                    processedRoleIds.push(roleId);
                } else if (typeof roleId === 'string') {
                    const { findRoleByName } = require('./roleController');
                    let roleInfo = await findRoleByName(roleId.trim());

                    if (!roleInfo) {
                        // Create new main role if not found
                        const newRole = await RoleModel.create({
                            name: roleId.trim(),
                            type: 'main',
                            isActive: true,
                            otherRoles: []
                        });
                        roleInfo = {
                            roleId: newRole._id,
                            roleName: newRole.name,
                            type: 'main'
                        };
                    }
                    processedRoleIds.push(roleInfo.roleId);
                }
            }
            data.roleId = processedRoleIds;
        }

        if (data.currentRole && typeof data.currentRole === 'string') {
            if (!mongoose.Types.ObjectId.isValid(data.currentRole)) {
                // Use smart role lookup for string names
                const { findRoleByName } = require('./roleController');
                let roleInfo = await findRoleByName(data.currentRole.trim());

                if (!roleInfo) {
                    // Create new main role if not found
                    const newRole = await RoleModel.create({
                        name: data.currentRole.trim(),
                        type: 'main',
                        isActive: true,
                        otherRoles: []
                    });
                    roleInfo = {
                        roleId: newRole._id,
                        roleName: newRole.name,
                        type: 'main'
                    };
                }
                data.currentRole = roleInfo.roleId;
            }
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
            message: "Candidates fetched successfully",
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

        // Add role search condition with 
        if (roleSearch) {
            const matchingRoles = await RoleModel.find({
                $or: [
                    { name: { $regex: roleSearch, $options: "i" }, isActive: true },
                    { otherRoles: { $regex: roleSearch, $options: "i" }, isActive: true }
                ]
            }).select('_id name type parentRoleId otherRoles').lean();

            const roleIds = matchingRoles.map(role => role._id);

            // Also find sub-roles that have matching parent roles
            const subRoles = await RoleModel.find({
                type: 'sub',
                parentRoleId: { $in: roleIds },
                isActive: true
            }).select('_id').lean();

            const allMatchingRoleIds = [...roleIds, ...subRoles.map(sr => sr._id)];

             const roleMatchConditions = [];

            if (allMatchingRoleIds.length > 0) {
                roleMatchConditions.push(
                    { "roleId": { $in: allMatchingRoleIds } },
                    { "currentRole": { $in: allMatchingRoleIds } }
                );
            }

            const regex = new RegExp(roleSearch, "i");
            roleMatchConditions.push(
                { "roleIdData.name": { $regex: regex } },
                { "roleIdData.otherRoles": { $elemMatch: { $regex: regex } } },
                { "currentRoleData.name": { $regex: regex } },
                { "currentRoleData.otherRoles": { $elemMatch: { $regex: regex } } }
            );

            matchConditions.push({
                $or: roleMatchConditions
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
            message: "Candidates fetched successfully",
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
        const userId = req.body.userId || null; // Guest users will have null
        const anonymousUserId = req.body.anonymousUserId || null;
        const filters = req.body.filters;

        if (!Array.isArray(filters) || filters.length === 0) {
            return res.status(400).json({
                message: "At least one filter is required.",
                status: false
            });
        }

        const savedFilters = [];
        for (const filter of filters) {
            let { jobTitle, minExperience = 0, maxExperience = 999 } = filter;
            jobTitle = jobTitle?.trim() || "";

            if (!jobTitle) continue;

            const existingQuery: any = {
                jobTitle: { $regex: new RegExp(`^${jobTitle}$`, 'i') }
            };

            // Check for existing filter based on userId or anonymousUserId
            if (userId) {
                existingQuery.userId = userId;
            } else if (anonymousUserId) {
                existingQuery.anonymousUserId = anonymousUserId;
            } else {
                existingQuery.userId = null;
                existingQuery.anonymousUserId = null;
            }

            const existing = await CandidateFilter.findOne(existingQuery);

            if (existing) continue;

            // Count matching candidates
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
                                    { "currentRoleData.otherRole": { $regex: jobTitle, $options: "i" } },
                                    { "technicalSkills": { $regex: jobTitle, $options: "i" } }
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
                anonymousUserId,
                jobTitle,
                minExperience,
                maxExperience,
                candidateCount: count
            });

            const saved = await newFilter.save();
            savedFilters.push(saved);
        }

        return res.status(201).json({
            message: `${savedFilters.length} filter(s) saved successfully.`,
            status: true,
            data: savedFilters
        });

    } catch (error: any) {
        return res.status(500).json({
            message: "Error saving filters",
            status: false,
            error: error.message
        });
    }
};

// Get list of saved filters
export const getRoleList = async (req: any, res: Response) => {
    try {
        const userId = req.body.userId || req.query.userId || null;
        const anonymousUserId = req.query.anonymousUserId || null;
        const { search } = req.query;

        const query: any = { active: true };

        if (userId) {
            query.userId = userId;
        } else if (anonymousUserId) {
            query.anonymousUserId = anonymousUserId;
        }

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
                                        { "currentRoleData.otherRole": { $regex: filter.jobTitle, $options: "i" } },
                                        { "technicalSkills": { $regex: filter.jobTitle, $options: "i" } }
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

// This API will return all unique anonymousUserId values from the CandidateFilter collection.
export const getUniqueAnonymousUsers = async (req: Request, res: Response) => {
  try {
    const uniqueUsers = await CandidateFilter.distinct("anonymousUserId");
    res.status(200).json({ success: true, data: uniqueUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err });
  }
};

// Get candidates by saved filter ID
export const getCandidatesByFilterId = async (req: any, res: Response) => {
    try {
        const { filterId } = req.params;
        const userId = req.body.userId || req.query.userId || null;
        const anonymousUserId = req.query.anonymousUserId || null;
        const { search } = req.query;
        console.log(filterId, anonymousUserId)
        // Get the saved filter
        const filterQuery: any = { _id: filterId, active: true };

        if (userId) {
            filterQuery.userId = userId;
        } else if (anonymousUserId) {
            filterQuery.anonymousUserId = anonymousUserId;
        }
        console.log(filterQuery)
        const filter = await CandidateFilter.findOne(filterQuery);
        console.log(filter)

        if (!filter) {
            return res.status(404).json({
                message: "Filter not found",
                status: false
            });
        }
        
        const matchingRoles = await RoleModel.find({
            $or: [
                { name: { $regex: filter.jobTitle, $options: "i" }, isActive: true },
                { otherRoles: { $elemMatch: { $regex: filter.jobTitle, $options: "i" } }, isActive: true }
            ]
        }).select('_id name type parentRoleId otherRoles').lean();

        const roleIds = matchingRoles.map(role => role._id);

        const subRoles = await RoleModel.find({
            type: 'sub',
            parentRoleId: { $in: roleIds },
            isActive: true
        }).select('_id').lean();

        const allMatchingRoleIds = [...roleIds, ...subRoles.map(sr => sr._id)];

        const relatedRoles = matchingRoles.reduce((roles: string[], role: any) => {
            if (role.name) {
                roles.push(role.name);
            }
            if (role.otherRoles && role.otherRoles.length > 0) {
                roles.push(...role.otherRoles);
            }
            return roles;
        }, [] as string[]);

        // Remove duplicates from roles array
        const uniqueRoles = [...new Set(relatedRoles)];

        const roleMatchConditions = [];

        if (allMatchingRoleIds.length > 0) {
            roleMatchConditions.push(
                { "roleId": { $in: allMatchingRoleIds } },
                { "currentRole": { $in: allMatchingRoleIds } }
            );
        }

        const regex = new RegExp(filter.jobTitle, "i");
        roleMatchConditions.push(
            { "roleData.name": { $regex: regex } },
            { "roleData.otherRoles": { $elemMatch: { $regex: regex } } },
            { "currentRoleData.name": { $regex: regex } },
            { "currentRoleData.otherRoles": { $elemMatch: { $regex: regex } } },
            { "technicalSkills": { $regex: regex } }
        );

        // Add related roles matching if we found related roles
        if (uniqueRoles.length > 0) {
            uniqueRoles.forEach((relatedRole: string) => {
                const relatedRegex = new RegExp(relatedRole, "i");
                roleMatchConditions.push(
                    { "roleData.name": { $regex: relatedRegex } },
                    { "roleData.otherRoles": { $elemMatch: { $regex: relatedRegex } } },
                    { "currentRoleData.name": { $regex: relatedRegex } },
                    { "currentRoleData.otherRoles": { $elemMatch: { $regex: relatedRegex } } },
                    { "technicalSkills": { $regex: relatedRegex } }
                );
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
                            $or: roleMatchConditions
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

        if (search) {
            pipeline.unshift({
                $match: {
                    fullName: { $regex: search, $options: "i" }
                }
            });
        }
        
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
        const userId = req.body.userId || req.query.userId || null;
        const anonymousUserId = req.query.anonymousUserId || null;

        const deleteQuery: any = { _id: filterId };

        if (userId) {
            deleteQuery.userId = userId;
        } else if (anonymousUserId) {
            deleteQuery.anonymousUserId = anonymousUserId;
        }

        const deletedFilter = await CandidateFilter.findOneAndDelete(deleteQuery);

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