import { Request, Response } from "express";
import Tag from "../Models/tagModel";

// Get all tags
export const getAllTags = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        
        const query: any = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const tags = await Tag.find(query).sort({ name: 1 });

        return res.status(200).json({
            message: "Tags fetched successfully",
            status: true,
            data: {
                tags,
                total: tags.length
            }
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to fetch tags",
            status: false,
            data: []
        });
    }
};

// Create new tag
export const createTag = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Tag name is required",
                status: false
            });
        }

        const newTag = new Tag({ name: name.trim() });
        const savedTag = await newTag.save();

        return res.status(201).json({
            message: "Tag created successfully",
            status: true,
            data: savedTag
        });
    } catch (err: any) {
        if (err.code === 11000) {
            return res.status(400).json({
                message: "Tag already exists",
                status: false
            });
        }
        return res.status(500).json({
            message: err.message || "Failed to create tag",
            status: false
        });
    }
};

// Update tag
export const updateTag = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Tag name is required",
                status: false
            });
        }

        const updatedTag = await Tag.findByIdAndUpdate(
            id,
            { name: name.trim() },
            { new: true }
        );

        if (!updatedTag) {
            return res.status(404).json({
                message: "Tag not found",
                status: false
            });
        }

        return res.status(200).json({
            message: "Tag updated successfully",
            status: true,
            data: updatedTag
        });
    } catch (err: any) {
        if (err.code === 11000) {
            return res.status(400).json({
                message: "Tag name already exists",
                status: false
            });
        }
        return res.status(500).json({
            message: err.message || "Failed to update tag",
            status: false
        });
    }
};

// Delete tag
export const deleteTag = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const deletedTag = await Tag.findByIdAndDelete(id);

        if (!deletedTag) {
            return res.status(404).json({
                message: "Tag not found",
                status: false
            });
        }

        return res.status(200).json({
            message: "Tag deleted successfully",
            status: true,
            data: deletedTag
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message || "Failed to delete tag",
            status: false
        });
    }
};
