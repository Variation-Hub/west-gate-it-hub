import { Request, Response } from "express"
import CandidateCvModel from "../Models/candidateCv"
import RoleModel from "../Models/roleModel"
import mongoose from "mongoose";
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
        const limit = Number(req.pagination?.limit) || 10;
        const skip = Number(req.pagination?.skip) || 0;
    
        const query: any = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (startDate && endDate) {
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        const roles = await RoleModel.aggregate([
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
                $project: {
                    _id: 1,
                    name: 1,
                    otherRole: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    totalSuppliersCount: { $size: "$uniqueSuppliers" },
                    activeSuppliersCount: { $size: "$activeSuppliers" },
                    totalCandidatesCount: { $size: "$cvs" },
                    activeCandidatesCount: {
                        $size: {
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
                }
            },
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);
    
        const totalRoles = await RoleModel.countDocuments(query);
    
        return res.status(200).json({
          message: "Roles fetched successfully",
          status: true,
          data: {
            roles,
            total: totalRoles,
            page: skip / limit + 1,
            totalPages: Math.ceil(totalRoles / limit),
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
        const { startDate, endDate, active } = req.query;

        const matchStage: any = { roleId: { $in: [new mongoose.Types.ObjectId(id)] } };

        if (startDate && endDate) {
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999);
            matchStage["createdAt"] = { $gte: start, $lte: end };
        }

        if (active !== undefined) {
            matchStage["active"] = active === "true";
        }

        const totalCandidates = await CandidateCvModel.countDocuments(matchStage);
        const activeCandidates = await CandidateCvModel.countDocuments({ ...matchStage, active: true });


        const candidates = await CandidateCvModel.find(matchStage)
            .populate("roleId", "name", "otherRole")
            .populate("supplierId", "name")
            .sort({ active: -1, createdAt: -1 });

        res.status(200).json({
            message: 'Candidates fetched successfully',
            status: true,
            data: candidates,
            meta_data: {
                totalCandidates,
                activeCandidates
            }
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message, status: false });
    }
};

export const getCount =  async (req: Request, res: Response) => {
    try {
        const roles = await RoleModel.find();
        
        const roleCounts = await Promise.all(roles.map(async (role) => {
            const count = await CandidateCvModel.countDocuments({ roleId: { $in: [role._id] } } );
            return { name: role.name, id: role._id, candidateCount: count };
        }));

        res.status(200).json({ message: 'Roles fetched successfully', status: true, data: roleCounts });
    } catch (err: any) {
        res.status(500).json({ message: err.message, status: false });
    }
};
