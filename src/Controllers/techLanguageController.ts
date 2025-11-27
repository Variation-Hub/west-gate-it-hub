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

// Get all technologies with candidate counts
export const getTechnologies = async (req: Request, res: Response) => {
    try {
        const { search, page, limit } = req.query;
        const query: any = {};
        
        if (search) {
            const searchRegex = new RegExp(search as string, "i");
            query.name = { $regex: searchRegex };
        }

        const shouldPaginate = page && limit;
        const pageNum = shouldPaginate ? parseInt(page as string) : 1;
        const limitNum = shouldPaginate ? parseInt(limit as string) : 0;
        const skip = shouldPaginate ? (pageNum - 1) * limitNum : 0;

        // Get total count for pagination
        const totalCount = await Technology.countDocuments(query);

        let technologiesQuery = Technology.find(query).sort({ name: 1 });

        if (shouldPaginate) {
            technologiesQuery = technologiesQuery.skip(skip).limit(limitNum);
        }

        const technologies = await technologiesQuery;

        // Add candidate counts for each technology
        const technologiesWithCounts = await Promise.all(
            technologies.map(async (technology) => {
                const candidateCount = await CandidateCvModel.countDocuments({
                    technicalSkills: { $regex: technology.name, $options: "i" },
                    active: true
                });

                return {
                    _id: technology._id,
                    name: technology.name,
                    isSystem: technology.isSystem,
                    candidateCount
                };
            })
        );

        const response: any = {
            message: "Technologies list fetched successfully",
            status: true,
            data: technologiesWithCounts
        };

        // Add pagination metadata
        if (shouldPaginate) {
            response.meta_data = {
                page: pageNum,
                items: totalCount,
                page_size: limitNum,
                pages: Math.ceil(totalCount / limitNum)
            };
        }

        return res.status(200).json(response);
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to fetch technologies",
            status: false,
            data: []
        });
    }
};

// Get candidates by technology
export const getCandidatesByTechnology = async (req: Request, res: Response) => {
    try {
        const { technologyName } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (!technologyName) {
            return res.status(400).json({
                message: "Technology name is required",
                status: false
            });
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        // Find candidates with this technology in technical skills
        const candidatesQuery = {
            technicalSkills: { $regex: technologyName, $options: "i" },
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
            message: "Error fetching candidates by technology",
            status: false,
            error: error.message
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

// Get all technologies for public use (with search support)
export const getPublicTechnologies = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;

        const query: any = {};

        if (search) {
            const searchRegex = new RegExp(search as string, "i");
            query.name = { $regex: searchRegex };
        }

        const technologies = await Technology.find(query)
            .select('_id name')
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