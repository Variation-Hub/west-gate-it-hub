import { Request, Response } from "express"
import categoryModel from "../Models/categoryModel";

export const createCategory = async (req: any, res: Response) => {
    try {
        let { category } = req.body;

        const Category = await categoryModel.findOne({ category })

        if (Category) {
            return res.status(402).json({
                message: "category already exists",
                status: false,
                data: null
            })
        }

        const newcategory = await categoryModel.create({ category });

        return res.status(200).json({
            message: "category created successfully",
            status: true,
            data: newcategory
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const getCategoryList = async (req: any, res: Response) => {
    try {

        const Category = await categoryModel.find()

        return res.status(200).json({
            message: "category fetched successfully",
            status: true,
            data: Category
        })

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const obj = req.body;

        const category: any = await categoryModel.findById(id);

        if (!category) {
            return res.status(404).json({
                message: "category not found",
                status: false,
                data: null
            });
        }

        Object.keys(obj).forEach(value => {
            category[value] = obj[value];
        });

        await category.save();

        return res.send({
            message: "category updated successfully",
            status: true,
            data: category
        })
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const category = await categoryModel.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({
                message: "category not found",
                status: false,
                data: null
            });
        }
        return res.status(200).json({
            message: "category delete success",
            status: true,
            data: category
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        })
    }
}
