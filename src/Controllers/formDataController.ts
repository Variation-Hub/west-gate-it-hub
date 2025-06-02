import { Request, Response } from "express";
import formDataModel from "../Models/formDataModel";

// Create new form data
export const createFormData = async (req: Request, res: Response) => {
    try {
        const { formType, formData } = req.body;

        // Validate form type
        const validFormTypes = [
            'workAwayForm',
            'e2eQaServiceForm',
            'e2eQaResourceForm',
            'itSubcontractForm',
            'itSubcontractingDeckForm',
            'contactUsForm'
        ];

        if (!validFormTypes.includes(formType)) {
            return res.status(400).json({
                message: "Invalid form type",
                status: false,
                data: null
            });
        }

        const newFormData = await formDataModel.create({
            formType,
            formData
        });

        return res.status(201).json({
            message: "Form data created successfully",
            status: true,
            data: newFormData
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
};

// Get all form data with pagination and search
export const getFormDataList = async (req: any, res: Response) => {
    try {
        const { search, formType } = req.query;
        let filter: any = { isDeleted: false };

        // Filter by form type if provided
        if (formType) {
            filter.formType = formType;
        }

        // Add search functionality in formData
        if (search) {
            filter.$or = [
                { 'formData.name': { $regex: search, $options: 'i' } },
                { 'formData.email': { $regex: search, $options: 'i' } },
                { 'formData.phone': { $regex: search, $options: 'i' } },
                { 'formData.company': { $regex: search, $options: 'i' } }
            ];
        }

        const count = await formDataModel.countDocuments(filter);
        const formData = await formDataModel.find(filter)
            .sort({ createdAt: -1 })
            .limit(req.pagination?.limit as number)
            .skip(req.pagination?.skip as number);

        return res.status(200).json({
            message: "Form data fetched successfully",
            status: true,
            data: {
                data: formData,
                meta_data: {
                    page: req.pagination?.page,
                    items: count,
                    page_size: req.pagination?.limit,
                    pages: Math.ceil(count / (req.pagination?.limit as number))
                }
            }
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
};

// Get single form data by ID
export const getFormDataById = async (req: Request, res: Response) => {
    try {
        const formData = await formDataModel.findOne({ 
            _id: req.params.id, 
            isDeleted: false 
        });
        
        if (!formData) {
            return res.status(404).json({
                message: "Form data not found",
                status: false,
                data: null
            });
        }

        return res.status(200).json({
            message: "Form data fetched successfully",
            status: true,
            data: formData
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
};

// Update form data
export const updateFormData = async (req: Request, res: Response) => {
    try {
        const { formData } = req.body;
        const existingForm = await formDataModel.findOne({ 
            _id: req.params.id, 
            isDeleted: false 
        });
        
        if (!existingForm) {
            return res.status(404).json({
                message: "Form data not found",
                status: false,
                data: null
            });
        }

        const updatedFormData = await formDataModel.findByIdAndUpdate(
            req.params.id,
            { formData },
            { new: true }
        );

        return res.status(200).json({
            message: "Form data updated successfully",
            status: true,
            data: updatedFormData
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
};

// Delete form data (soft delete)
export const deleteFormData = async (req: Request, res: Response) => {
    try {
        const formData = await formDataModel.findOne({ 
            _id: req.params.id, 
            isDeleted: false 
        });
        
        if (!formData) {
            return res.status(404).json({
                message: "Form data not found",
                status: false,
                data: null
            });
        }

        await formDataModel.findByIdAndUpdate(req.params.id, { isDeleted: true });

        return res.status(200).json({
            message: "Form data deleted successfully",
            status: true,
            data: null
        });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}; 