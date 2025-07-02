import { Request, Response } from "express";
import Technology from "../Models/technologyModel";
import Language from "../Models/languageModel";
import userModel from "../Models/userModel";
import CandidateCvModel from "../Models/candidateCv";
import mongoose from "mongoose";

// Create a new technology
export const createTechnology = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                message: "Technology name is required",
                status: false
            });
        }
        
        // Check if technology already exists
        const existingTech = await Technology.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, "i") }
        });
        
        if (existingTech) {
            return res.status(409).json({
                message: "Technology already exists",
                status: false
            });
        }
        
        // Create new technology
        const newTechnology = await Technology.create({
            name,
            isSystem: false
        });
        
        return res.status(201).json({
            message: "Technology created successfully",
            status: true,
            data: newTechnology
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to create technology",
            status: false
        });
    }
};

// Create a new language
export const createLanguage = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                message: "Language name is required",
                status: false
            });
        }
        
        // Check if language already exists
        const existingLang = await Language.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, "i") }
        });
        
        if (existingLang) {
            return res.status(409).json({
                message: "Language already exists",
                status: false
            });
        }
        
        // Create new language
        const newLanguage = await Language.create({
            name,
            isSystem: false
        });
        
        return res.status(201).json({
            message: "Language created successfully",
            status: true,
            data: newLanguage
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to create language",
            status: false
        });
    }
};

// Delete a technology
export const deleteTechnology = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid technology ID",
                status: false
            });
        }
        
        const technology = await Technology.findById(id);
        
        if (!technology) {
            return res.status(404).json({
                message: "Technology not found",
                status: false
            });
        }
        
        // if (technology.isSystem) {
        //     return res.status(403).json({
        //         message: "System technologies cannot be deleted",
        //         status: false
        //     });
        // }
        
        const techName = technology.name;

        await Technology.findByIdAndDelete(id);

        await userModel.updateMany(
            { technologyStack: techName },
            { $pull: { technologyStack: techName } }
        );

        return res.status(200).json({
            message: "Technology deleted successfully",
            status: true
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to delete technology",
            status: false
        });
    }
};

// Delete a language
export const deleteLanguage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid language ID",
                status: false
            });
        }
        
        const language = await Language.findById(id);
        
        if (!language) {
            return res.status(404).json({
                message: "Language not found",
                status: false
            });
        }
        
        // if (language.isSystem) {
        //     return res.status(403).json({
        //         message: "System languages cannot be deleted",
        //         status: false
        //     });
        // }

        const langName = language.name;

        await Language.findByIdAndDelete(id);

        await CandidateCvModel.updateMany(
            { languagesKnown: langName },
            { $pull: { languagesKnown: langName } }
        );

        return res.status(200).json({
            message: "Language deleted successfully",
            status: true
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to delete language",
            status: false
        });
    }
};

// Get all technologies with IDs (for admin management)
export const getTechnologies = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        
        const query: any = {};
        
        if (search) {
            const searchRegex = new RegExp(search as string, "i");
            query.name = { $regex: searchRegex };
        }
        
        const technologies = await Technology.find(query)
            .sort({ name: 1 });
            
        return res.status(200).json({
            message: "Technologies list fetched successfully",
            status: true,
            data: technologies
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to fetch technologies",
            status: false,
            data: []
        });
    }
};

// Get all languages with IDs (for admin management)
export const getLanguages = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        
        const query: any = {};
        
        if (search) {
            const searchRegex = new RegExp(search as string, "i");
            query.name = { $regex: searchRegex };
        }
        
        const languages = await Language.find(query)
            .sort({ name: 1 });
            
        return res.status(200).json({
            message: "Languages list fetched successfully",
            status: true,
            data: languages
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to fetch languages",
            status: false,
            data: []
        });
    }
};

export const updateTechnology = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid technology ID",
                status: false
            });
        }
        
        if (!name) {
            return res.status(400).json({
                message: "Technology name is required",
                status: false
            });
        }
        
        const updatedTechnology = await Technology.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        );
        
        if (!updatedTechnology) {
            return res.status(404).json({
                message: "Technology not found",
                status: false
            });
        }
        
        return res.status(200).json({
            message: "Technology updated successfully",
            status: true,
            data: updatedTechnology
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to update technology",
            status: false
        });
    }
};

export const updateLanguage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid language ID",
                status: false
            });
        }
        
        if (!name) {
            return res.status(400).json({
                message: "Language name is required",
                status: false
            });
        }
        
        const updatedLanguage = await Language.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        );
        
        if (!updatedLanguage) {
            return res.status(404).json({
                message: "Language not found",
                status: false
            });
        }
        
        return res.status(200).json({
            message: "Language updated successfully",
            status: true,
            data: updatedLanguage
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to update language",
            status: false
        });
    }
};