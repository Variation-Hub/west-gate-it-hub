import { Request, Response } from "express"
import CandidateCvModel from "../Models/candidateCv"
import RoleModel from "../Models/roleModel"
import mongoose from "mongoose";
const technologies = require('../Util/technologies.json');

export const createRole = async (req: Request, res: Response) => {
    try {
        const { name, otherRole } = req.body;
        if (!name) return res.status(400).json({ message: 'Role name is required', status: false });

        const existingRole = await RoleModel.findOne({ name });
        if (existingRole) return res.status(400).json({ message: 'Role already exists', status: false });

        const newRole = new RoleModel({ name, otherRole: otherRole || [] });
        await newRole.save();
        res.status(201).json({ message: 'Role created successfully', status: true, data: newRole });
    } catch (err: any) {
        res.status(500).json({ message: err.message, status: false });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, otherRole } = req.body;
        if (!name) return res.status(400).json({ message: 'Role name is required', status: false });

        const updatedRole = await RoleModel.findByIdAndUpdate(id, { name, otherRole: otherRole || [] }, { new: true });
        if (!updatedRole) return res.status(404).json({ message: 'Role not found', status: false });

        res.status(200).json({ message: 'Role updated successfully', status: true, data: updatedRole });
    } catch (err: any) {
        res.status(500).json({ message: err.message, status: false });
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
        const { search, startDate, endDate } = req.query;
        // const limit = Number(req.pagination?.limit) || 10;
        // const skip = Number(req.pagination?.skip) || 0;

        const query: any = {};
        if (search) {
            query["$or"] = [
                { name: { $regex: search, $options: "i" } },
                { otherRoles: { $regex: search, $options: "i" } }
            ];
        }

        if (startDate && endDate) {
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        const result = await RoleModel.aggregate([
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

          const roles = result[0]?.roles || [];
          const total = result[0]?.total || 0;
          const totalActiveCandidates = result[0]?.totalActiveCandidates || 0;
          const totalExecutiveTrueCount = result[0]?.totalExecutiveTrueCount || 0;
          const totalExecutiveFalseCount = result[0]?.totalExecutiveFalseCount || 0;
          
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
            .populate("roleId", ["name", "otherRole"])
            .populate("supplierId", "name")
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
        const { search } = req.query;

        const query: any = {};
        if (search) {
            query["$or"] = [
                { name: { $regex: search, $options: "i" } },
                { otherRoles: { $regex: search, $options: "i" } }
            ];
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