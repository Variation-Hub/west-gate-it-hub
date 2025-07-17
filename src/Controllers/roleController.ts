import { Request, Response } from "express"
import CandidateCvModel from "../Models/candidateCv"
import RoleModel from "../Models/roleModel"
import mongoose from "mongoose";
const technologies = require('../Util/technologies.json');

const normalizeName = (name: string): string => {
  return name
    .replace(/\s+/g, ' ')        // replace multiple spaces with single
    .replace(/\s+\(/g, '(')      // remove space before (
    .replace(/\(\s+/g, '(')      // remove space after (
    .replace(/\s+\)/g, ')')      // remove space before )
    .trim();              // remove trailing spaces
};


export const createRole = async (req: Request, res: Response) => {
    try {
        const { name, otherRole } = req.body;
        if (!name) return res.status(400).json({ message: 'Role name is required', status: false });
        const normalizedRoleName = normalizeName(name);
        const existingRole = await RoleModel.findOne({ name: normalizedRoleName, isActive: true });
        if (existingRole) return res.status(400).json({ message: 'Role already exists', status: false });

        const newRole = new RoleModel({
            name: normalizedRoleName,
            type: 'main',
            isActive: true,
            otherRoles: otherRole || []
        });
        await newRole.save();

        // Auto-create sub-role documents for otherRoles
        if (otherRole && otherRole.length > 0) {
            for (const otherRoleName of otherRole) {
                if (otherRoleName && otherRoleName.trim()) {
                    const existingSubRole = await RoleModel.findOne({
                        name: normalizeName(otherRoleName.trim()),
                        type: 'sub',
                        parentRoleId: newRole._id
                    });

                    if (!existingSubRole) {
                        await RoleModel.create({
                            name: normalizeName(otherRoleName.trim()),
                            type: 'sub',
                            parentRoleId: newRole._id,
                            isActive: true
                        });
                    }
                }
            }
        }

        res.status(201).json({ message: 'Role created successfully', status: true, data: newRole });
    } catch (err: any) {
        res.status(500).json({ message: err.message, status: false });
    }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, otherRoles } = req.body;

    if (!name) return res.status(400).json({ message: 'Role name is required', status: false });

    const existingRole = await RoleModel.findById(id);
    if (!existingRole) return res.status(404).json({ message: 'Role not found', status: false });

    const normalizedRoleName = normalizeName(name);
    const oldOtherRoles = existingRole.otherRoles || [];
    const newOtherRoles = otherRoles || [];

    // Step 1: Update main role
    const updatedRole = await RoleModel.findByIdAndUpdate(
      id,
      {
        name: normalizedRoleName,
        otherRoles: newOtherRoles,
        type: existingRole.type || 'main',
        isActive: true,
      },
      { new: true }
    );

    // Step 2: Deactivate removed sub-roles - not really needed 
    const rolesToDeactivate = oldOtherRoles.filter((r: string) => !newOtherRoles.includes(r));
    if (rolesToDeactivate.length > 0) {
      await RoleModel.updateMany(
        {
          name: { $in: rolesToDeactivate },
          parentRoleId: id,
          type: 'sub',
        },
        { isActive: false }
      );
    }

    // Step 3: Handle new or changed sub-roles
    for (const roleName of newOtherRoles) {
      const trimmedName = roleName.trim();
      if (!trimmedName) continue;

      let subRole = await RoleModel.findOne({ name: normalizeName(trimmedName) });

      // If role exists
      if (subRole) {
        // If it's a main role (convert to sub)
        if (subRole.type === 'main') {
          subRole.type = 'sub';
          subRole.parentRoleId = new mongoose.Types.ObjectId(id);
          subRole.isActive = true;
          await subRole.save();
        }

        // If sub-role but with different parent, update
        else if (subRole.type === 'sub' && subRole.parentRoleId?.toString() !== id) {
          subRole.parentRoleId = new mongoose.Types.ObjectId(id);
          subRole.isActive = true;
          await subRole.save();
        }

        // If it's already correct sub-role, just activate
        else {
          subRole.isActive = true;
          await subRole.save();
        }
      } else {
        // Create new sub-role
        subRole = await RoleModel.create({
          name: normalizeName(trimmedName),
          type: 'sub',
          parentRoleId: id,
          isActive: true,
        });
      }

      // Step 5: Migrate any inactive roles with same name
      const inactiveRoles = await RoleModel.find({
        name: normalizeName(trimmedName),
        isActive: false,
      }).select('_id');

      const inactiveRoleIds = inactiveRoles.map(r => r._id);

      if (inactiveRoleIds.length > 0) {
        await CandidateCvModel.updateMany(
          { roleId: { $in: inactiveRoleIds } },
          { $set: { "roleId.$[elem]": subRole._id } },
          { arrayFilters: [{ "elem": { $in: inactiveRoleIds } }] }
        );

        await CandidateCvModel.updateMany(
          { currentRole: { $in: inactiveRoleIds } },
          { $set: { currentRole: subRole._id } }
        );
      }
    }

    return res.status(200).json({ message: 'Role updated successfully', status: true, data: updatedRole });
  } catch (err: any) {
    return res.status(500).json({ message: err.message, status: false });
  }
};
export const deleteRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await RoleModel.findByIdAndDelete(id);
        res.status(200).json({ message: 'Role deleted successfully', status: true });
    } catch (err: any) {
        res.status(500).json({ message: err.message, status: false });
    }
};

export const getAllRoles = async (req: Request, res: Response) => {
    try {
        const { search, startDate, endDate, supplierId, type, role } = req.query;
        // const limit = Number(req.pagination?.limit) || 10;
        // const skip = Number(req.pagination?.skip) || 0;

        let query: any = {};

        if (role !== 'admin') {
            query.isActive = true;
        }

        if (search) {
            query["$or"] = [
                { name: { $regex: search, $options: "i" } },
                { otherRoles: { $regex: search, $options: "i" } }
            ];
        }

        if (type) {
            query.type = type;
        }

        if (startDate && endDate) {
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        let result;

        if (role === 'admin') {
            // For admin, get all roles with counts (including zero counts)
            result = await RoleModel.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: "candidatecvs",
                        localField: "_id",
                        foreignField: "roleId",
                        as: "candidatesAsRole"
                    }
                },
                {
                    $lookup: {
                        from: "candidatecvs",
                        localField: "_id",
                        foreignField: "currentRole",
                        as: "candidatesAsCurrent"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "candidatesAsRole.supplierId",
                        foreignField: "_id",
                        as: "suppliersFromRole"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "candidatesAsCurrent.supplierId",
                        foreignField: "_id",
                        as: "suppliersFromCurrent"
                    }
                },
                {
                    $addFields: {
                        allCandidates: { $concatArrays: ["$candidatesAsRole", "$candidatesAsCurrent"] },
                        allSuppliers: { $concatArrays: ["$suppliersFromRole", "$suppliersFromCurrent"] }
                    }
                },
                {
                    $addFields: {
                        totalCandidatesCount: { $size: "$allCandidates" },
                        activeCandidatesCount: {
                            $size: {
                                $filter: {
                                    input: "$allCandidates",
                                    as: "candidate",
                                    cond: { $eq: ["$$candidate.active", true] }
                                }
                            }
                        },
                        totalSuppliersCount: { $size: { $setUnion: ["$allSuppliers._id", []] } },
                        activeSuppliersCount: {
                            $size: {
                                $setUnion: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: "$allSuppliers",
                                                    as: "supplier",
                                                    cond: { $eq: ["$$supplier.active", true] }
                                                }
                                            },
                                            as: "activeSupplier",
                                            in: "$$activeSupplier._id"
                                        }
                                    },
                                    []
                                ]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        type: 1,
                        otherRoles: 1,
                        isActive: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        totalCandidatesCount: 1,
                        activeCandidatesCount: 1,
                        totalSuppliersCount: 1,
                        activeSuppliersCount: 1
                    }
                },
                { $sort: { createdAt: -1, _id: -1 } }
            ]);

            // Convert to the expected format
            result = [{
                roles: result,
                total: result.length,
                totalActiveCandidates: result.reduce((sum: number, role: any) => sum + (role.activeCandidatesCount || 0), 0),
                totalExecutiveTrueCount: 0,
                totalExecutiveFalseCount: 0
            }];
        } else {
            // Original aggregation for normal users
            result = await RoleModel.aggregate([
                { $match: query },
            {
              $lookup: {
                from: "candidatecvs",
                localField: "_id",
                foreignField: "roleId",
                as: "cvs",
              },
            },
            {
              $addFields: {
                cvs: supplierId ? {
                  $filter: {
                    input: "$cvs",
                    as: "cv",
                    cond: {
                      $and: [
                        { $eq: ["$$cv.supplierId", new mongoose.Types.ObjectId(supplierId as string)] },
                        { $eq: ["$$cv.currentRole", "$_id"] }
                      ]
                    }
                  }
                } : "$cvs"
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "cvs.supplierId",
                foreignField: "_id",
                as: "suppliers",
              },
            },
            {
              $addFields: {
                uniqueSuppliers: { $setUnion: ["$cvs.supplierId", []] },
                activeSuppliers: {
                  $filter: {
                    input: "$suppliers",
                    as: "supplier",
                    cond: { $eq: ["$$supplier.active", true] }
                  }
                }
              }
            },
            {
              $addFields: {
                totalSuppliersCount: { $size: "$uniqueSuppliers" },
                activeSuppliersCount: { $size: "$activeSuppliers" },
                totalCandidatesCount: { $size: "$cvs" },
                activeCandidates: {
                  $filter: {
                    input: "$cvs",
                    as: "candidate",
                    cond: {
                      $and: [
                        { $eq: ["$$candidate.active", true] },
                        {
                          $in: ["$$candidate.supplierId",
                            { $map: { input: "$activeSuppliers", as: "sup", in: "$$sup._id" } }
                          ]
                        }
                      ]
                    }
                  }
                }
              }
            },
            {
              $addFields: {
                activeCandidatesCount: { $size: "$activeCandidates" }
              }
            },
            {
              $match: {
                activeSuppliersCount: { $gt: 0 }
              }
            },
            {
              $facet: {
                roles: [
                  { $sort: { createdAt: -1, _id: -1 } },
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      otherRoles: 1,
                      createdAt: 1,
                      updatedAt: 1,
                      type: 1,
                      totalSuppliersCount: 1,
                      activeSuppliersCount: 1,
                      totalCandidatesCount: 1,
                      activeCandidatesCount: 1,
                      executiveTrueCount: {
                        $size: {
                          $filter: {
                            input: "$activeCandidates",
                            as: "candidate",
                            cond: { $eq: ["$$candidate.executive", true] }
                          }
                        }
                      },
                      executiveFalseCount: {
                        $size: {
                          $filter: {
                            input: "$activeCandidates",
                            as: "candidate",
                            cond: { $eq: ["$$candidate.executive", false] }
                          }
                        }
                      }
                    }
                  }
                ],
                total: [
                  { $count: "count" }
                ],
                totalActiveCandidates: [
                  { $unwind: "$activeCandidates" },
                  {
                    $group: {
                      _id: "$activeCandidates._id"
                    }
                  },
                  {
                    $count: "count"
                  }
                ],
                totalExecutiveTrue: [
                  { $unwind: "$activeCandidates" },
                  { $match: { "activeCandidates.executive": true } },
                  {
                    $group: {
                      _id: "$activeCandidates._id"
                    }
                  },
                  {
                    $count: "count"
                  }
                ],
                totalExecutiveFalse: [
                  { $unwind: "$activeCandidates" },
                  { $match: { "activeCandidates.executive": false } },
                  {
                    $group: {
                      _id: "$activeCandidates._id"
                    }
                  },
                  {
                    $count: "count"
                  }
                ]
              }
            },
            {
              $project: {
                roles: 1,
                total: { $arrayElemAt: ["$total.count", 0] },
                totalActiveCandidates: { $arrayElemAt: ["$totalActiveCandidates.count", 0] },
                totalExecutiveTrueCount: { $arrayElemAt: ["$totalExecutiveTrue.count", 0] },
                totalExecutiveFalseCount: { $arrayElemAt: ["$totalExecutiveFalse.count", 0] },
              }
            },
            { $sort: { "roles.createdAt": -1, "roles._id": -1 } },
            // { $skip: skip },
            // { $limit: limit },
          ]);
        }

          let roles = result[0]?.roles || [];
          const total = result[0]?.total || 0;
          const totalActiveCandidates = result[0]?.totalActiveCandidates || 0;
          const totalExecutiveTrueCount = result[0]?.totalExecutiveTrueCount || 0;
          const totalExecutiveFalseCount = result[0]?.totalExecutiveFalseCount || 0;

          if (role === 'admin') {
            const processedRoles = [];
            const processedRoleNames = new Set();

            for (const roleItem of roles) {
              if (roleItem.type === 'main') {
                const otherRolesWithCounts = [];

                if (roleItem.otherRoles && roleItem.otherRoles.length > 0) {
                  for (const otherRoleName of roleItem.otherRoles) {
                    const subRole = roles.find((r: any) => r.name === otherRoleName && r.type === 'sub');
                    if (subRole) {
                      otherRolesWithCounts.push({
                        id: subRole._id,
                        name: otherRoleName,
                        totalCandidatesCount: subRole.totalCandidatesCount || 0,
                        activeCandidatesCount: subRole.activeCandidatesCount || 0,
                        totalSuppliersCount: subRole.totalSuppliersCount || 0,
                        activeSuppliersCount: subRole.activeSuppliersCount || 0
                      });

                      processedRoleNames.add(otherRoleName);
                    } else {
                      otherRolesWithCounts.push({
                        id: null,
                        name: otherRoleName,
                        totalCandidatesCount: 0,
                        activeCandidatesCount: 0,
                        totalSuppliersCount: 0,
                        activeSuppliersCount: 0
                      });
                    }
                  }
                }

                processedRoles.push({
                  ...roleItem,
                  otherRoles: roleItem.otherRoles,
                  otherRolesWithCounts
                });

                processedRoleNames.add(roleItem.name);
              }
            }

            // Add sub roles that are not part of any main role
            for (const roleItem of roles) {
              if (roleItem.type === 'sub' && !processedRoleNames.has(roleItem.name)) {
                processedRoles.push(roleItem);
              }
            }

            roles = processedRoles;
          }

        return res.status(200).json({
            message: "Roles fetched successfully",
            status: true,
            data: {
                roles,
                total,
                totalActiveCandidates,
                totalExecutiveTrueCount,
                totalExecutiveFalseCount
            },
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
        });
    }
};

export const getlistByRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, active, executive } = req.query;

        const matchStage: any = { roleId: { $in: [new mongoose.Types.ObjectId(id)] } };
        const dateFilter: any = { roleId: { $in: [new mongoose.Types.ObjectId(id)] } };

        if (startDate && endDate) {
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999);
            dateFilter["createdAt"] = { $gte: start, $lte: end };
            matchStage.createdAt = { $gte: start, $lte: end };
        }
        const totalCandidates = await CandidateCvModel.countDocuments(matchStage);
        if (active === "true") {
            matchStage["active"] = true;
        } else if (active === "false") {
            matchStage["active"] = false;
        }

        if (executive == 'true') {
            matchStage["executive"] = true;
        } else if (executive == "false") {
            matchStage["executive"] = false;
        }
        
        const activeCandidates = await CandidateCvModel.countDocuments({ ...dateFilter, active: true });
        const inActiveCandidates = await CandidateCvModel.countDocuments({ ...dateFilter, active: false });

        const candidates = await CandidateCvModel.find(matchStage)
            .populate("roleId", ["name", "type", "parentRoleId", "otherRoles"])
            .populate("supplierId", "name")
            .populate("currentRole", ["name", "type", "parentRoleId"])
            .sort({ active: -1, createdAt: -1 });

        res.status(200).json({
            message: 'Candidates fetched successfully',
            status: true,
            data: candidates,
            meta_data: {
                totalCandidates,
                activeCandidates,
                inActiveCandidates
            }
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message, status: false });
    }
};

export const getCount = async (req: Request, res: Response) => {
    try {
        const roles = await RoleModel.find();

        const roleCounts = await Promise.all(roles.map(async (role) => {
            const count = await CandidateCvModel.countDocuments({ roleId: { $in: [role._id] } });
            return { name: role.name, id: role._id, candidateCount: count };
        }));

        res.status(200).json({ message: 'Roles fetched successfully', status: true, data: roleCounts });
    } catch (err: any) {
        res.status(500).json({ message: err.message, status: false });
    }
};

export const roleList = async (req: Request, res: Response) => {
    try {
        const { search, type } = req.query;

        const query: any = { isActive: true };
        if (search) {
            query["$or"] = [
                { name: { $regex: search, $options: "i" } },
                { otherRoles: { $regex: search, $options: "i" } }
            ];
        }

        if (type) {
            query.type = type;
        }

        const roles = await RoleModel.find(query);

        //const totalRoles = await RoleModel.countDocuments(query);

        return res.status(200).json({
            message: "Roles fetched successfully",
            status: true,
            data: {
                roles,
                // total: totalRoles,
                // page: skip / limit + 1,
                // totalPages: Math.ceil(totalRoles / limit),
            },
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
        });
    }
};

export const getTechnologies = async (req: any, res: Response) => {
    try {
        const { search } = req.query;

        let filteredData = technologies;

        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = technologies.filter((item: any) =>
                item.toLowerCase().includes(searchLower)
            );
        }

        return res.status(200).json({
            message: "Technologies list fetched successfully",
            status: true,
            data: filteredData
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to fetch Technologies",
            status: false,
            data: []
        });
    }
};

// Public API to get all roles and other roles combined in one list
export const getAllRolesCombined = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;

        const roles = await RoleModel.find({ isActive: true }).select('name type otherRoles relatedRoles');

        const combinedRoles: string[] = [];

        roles.forEach(role => {
            if (role.name) {
                combinedRoles.push(role.name);
            }

            // For main roles, also include their otherRoles
            if (role.type !== 'sub' && role.otherRoles && role.otherRoles.length > 0) {
                role.otherRoles.forEach(otherRole => {
                    if (otherRole && otherRole.trim()) {
                        combinedRoles.push(otherRole.trim());
                    }
                });
            }

            if (role.relatedRoles && role.relatedRoles.length > 0) {
                role.relatedRoles.forEach(relatedRole => {
                    if (relatedRole && relatedRole.trim()) {
                        combinedRoles.push(relatedRole.trim());
                    }
                });
            }
        });

        const uniqueRoles = [...new Set(combinedRoles)].sort((a, b) =>
            a.toLowerCase().localeCompare(b.toLowerCase())
        );

        let filteredRoles = uniqueRoles;
        if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            filteredRoles = uniqueRoles.filter(role =>
                role.toLowerCase().includes(searchLower)
            );
        }

        return res.status(200).json({
            message: "Roles list fetched successfully",
            status: true,
            data: {
                roles: filteredRoles,
                total: filteredRoles.length,
                totalUnique: uniqueRoles.length
            }
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to fetch roles",
            status: false,
            data: null
        });
    }
};

// Helper function to find role by name (checks both main and sub roles)
export const findRoleByName = async (roleName: string) => {
    if (!roleName || !roleName.trim()) return null;

  function escapeRegExp(str: any) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
    const trimmedName = roleName.trim();
    let safeInput = escapeRegExp(trimmedName);
    // First check if it exists as any role (main or sub)
    let role = await RoleModel.findOne({
        name: { $regex: `^${safeInput}$`, $options: 'i' },
        isActive: true
    });

    if (role) {
        return {
            roleId: role._id,
            roleName: role.name,
            type: role.type || 'main',
            parentRoleId: role.parentRoleId
        };
    }

    // If not found as direct role, check if it exists in otherRoles of any main role
    const parentRole = await RoleModel.findOne({
        otherRoles: { $regex: `^${safeInput}$`, $options: 'i' },
        isActive: true,
        type: { $ne: 'sub' } // Only check main roles for otherRoles
    });

    if (parentRole) {
        // Check if this sub-role already exists as a separate document
        let subRole = await RoleModel.findOne({
            name: { $regex: `^${safeInput}$`, $options: 'i' },
            type: 'sub',
            parentRoleId: parentRole._id,
            isActive: true
        });

        if (!subRole) {
            // Auto-create sub-role document if it doesn't exist
            subRole = new RoleModel({
                name: safeInput,
                type: 'sub',
                parentRoleId: parentRole._id,
                isActive: true
            });
            await subRole.save();
        }

        return {
            roleId: subRole._id,
            roleName: subRole.name,
            type: 'sub',
            parentRoleId: parentRole._id,
            parentRoleName: parentRole.name
        };
    }

    return null;
};

// Get candidates by role
export const getCandidatesByRoleCount = async (req: Request, res: Response) => {
    try {
        const { roleId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (!roleId) {
            return res.status(400).json({
                message: "Role ID is required",
                status: false
            });
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        // Find candidates with this role
        const candidatesQuery = {
            $or: [
                { roleId: new mongoose.Types.ObjectId(roleId) },
                { currentRole: new mongoose.Types.ObjectId(roleId) }
            ],
            active: true
        };

        const totalCount = await CandidateCvModel.countDocuments(candidatesQuery);

        const candidates = await CandidateCvModel.find(candidatesQuery)
            .populate("roleId", ["name", "type", "parentRoleId", "otherRoles"])
            .populate("currentRole", ["name", "type", "parentRoleId"])
            .populate("supplierId", ["name", "companyName", "email"])
            .skip(skip)
            .limit(parseInt(limit as string))
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            message: "Candidates fetched successfully",
            status: true,
            data: candidates,
            meta_data: {
                page: parseInt(page as string),
                items: totalCount,
                page_size: parseInt(limit as string),
                pages: Math.ceil(totalCount / parseInt(limit as string))
            }
        });

    } catch (error: any) {
        return res.status(500).json({
            message: "Error fetching candidates by role",
            status: false,
            error: error.message
        });
  }
};
