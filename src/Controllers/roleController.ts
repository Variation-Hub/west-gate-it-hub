import { Request, Response } from "express"
import CandidateCvModel from "../Models/candidateCv"
import RoleModel from "../Models/roleModel"

export const createRole = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Role name is required', status: false });
        
        const existingRole = await RoleModel.findOne({ name });
        if (existingRole) return res.status(400).json({ message: 'Role already exists', status: false });
        
        const newRole = new RoleModel({ name });
        await newRole.save();
        res.status(201).json({ message: 'Role created successfully', status: true, data: newRole });
    } catch (err: any) {
        res.status(500).json({ message: err.message, status: false });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Role name is required', status: false });
        
        const updatedRole = await RoleModel.findByIdAndUpdate(id, { name }, { new: true });
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
        const { search } = req.query;
        const limit = Number(req.pagination?.limit) || 10;
        const skip = Number(req.pagination?.skip) || 0;
    
        const query: any = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const roles = await RoleModel.find(query)
          .limit(limit)
          .skip(skip)
          .sort({ createdAt: -1, _id: -1 });
    
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
        const candidates = await CandidateCvModel.find({ roleId: id }).populate("roleId", "name");
        res.status(200).json({ message: 'Candidates fetched successfully', status: true, data: candidates });
    } catch (err: any) {
        res.status(500).json({ message: err.message, status: false });
    }
};

export const getCount =  async (req: Request, res: Response) => {
    try {
        const roles = await RoleModel.find();
        
        const roleCounts = await Promise.all(roles.map(async (role) => {
            const count = await CandidateCvModel.countDocuments({ roleId: role._id });
            return { name: role.name, id: role._id, candidateCount: count };
        }));

        res.status(200).json({ message: 'Roles fetched successfully', status: true, data: roleCounts });
    } catch (err: any) {
        res.status(500).json({ message: err.message, status: false });
    }
};
