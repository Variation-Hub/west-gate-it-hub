import { Request, Response } from "express";
import SubExpertise from "../Models/subExpertiseModel";
import userModel from "../Models/userModel";
import FileModel from "../Models/fileModel";
import mongoose from "mongoose";

// Create a new sub-expertise
export const createSubExpertise = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                message: "Sub-expertise name is required",
                status: false
            });
        }
        
        // Check if sub-expertise already exists
        const existingSubExp = await SubExpertise.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, "i") }
        });
        
        if (existingSubExp) {
            return res.status(409).json({
                message: "Sub-expertise already exists",
                status: false
            });
        }
        
        // Create new sub-expertise
        const newSubExpertise = await SubExpertise.create({
            name,
            isSystem: false
        });
        
        return res.status(201).json({
            message: "Sub-expertise created successfully",
            status: true,
            data: newSubExpertise
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to create sub-expertise",
            status: false
        });
    }
};

// Delete a sub-expertise
export const deleteSubExpertise = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid sub-expertise ID",
                status: false
            });
        }
        
        const subExpertise = await SubExpertise.findById(id);
        
        if (!subExpertise) {
            return res.status(404).json({
                message: "Sub-expertise not found",
                status: false
            });
        }
        
        if (subExpertise.isSystem) {
            return res.status(403).json({
                message: "System sub-expertise cannot be deleted",
                status: false
            });
        }
        
        // Get the sub-expertise name before deleting
        const subExpName = subExpertise.name;
        
        // Delete the sub-expertise from the SubExpertise collection
        await SubExpertise.findByIdAndDelete(id);
        
        // Remove the sub-expertise from users' expertise.subExpertise arrays
        const users = await userModel.find({ "expertise.subExpertise": subExpName });
        
        for (const user of users) {
            for (const exp of user.expertise) {
                if (exp.subExpertise && exp.subExpertise.includes(subExpName)) {
                    exp.subExpertise = exp.subExpertise.filter((item: string) => item !== subExpName);
                }
            }
            await user.save();
        }
        
        // Delete related files
        await FileModel.deleteMany({ subExpertise: subExpName });
        
        return res.status(200).json({
            message: "Sub-expertise deleted successfully and removed from all users",
            status: true
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to delete sub-expertise",
            status: false
        });
    }
};

export const getAllSubExpertise = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        
        const query: any = {};
        
        if (search) {
            const searchRegex = new RegExp(search as string, "i");
            query.name = { $regex: searchRegex };
        }
        
        const subExpertiseList = await SubExpertise.find(query)
            .sort({ name: 1 });
            
        return res.status(200).json({
            message: "Sub-expertise list fetched successfully",
            status: true,
            data: subExpertiseList
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to fetch sub-expertise",
            status: false,
            data: []
        });
    }
};
