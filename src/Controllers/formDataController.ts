import { Request, Response } from "express";
import formDataModel from "../Models/formDataModel";
import CandidateFilter from "../Models/candidateFilter";
import SupplierFilter from "../Models/supplierFilter";

// Create new form data
export const createFormData = async (req: Request, res: Response) => {
    try {
        const { formType, formData, userId, anonymousUserId } = req.body;

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

        // Get user's saved filters if they exist
        let candidateFilters: any[] = [];
        let supplierFilters: any[] = [];

        if (userId || anonymousUserId) {
            const filterQuery: any = {};
            if (userId) {
                filterQuery.userId = userId;
            } else if (anonymousUserId) {
                filterQuery.anonymousUserId = anonymousUserId;
            }

            // Get candidate filters
            const candidateFilterDocs = await CandidateFilter.find({
                ...filterQuery,
                active: true
            });
            candidateFilters = candidateFilterDocs.map(filter => filter._id);

            // Get supplier filters
            const supplierFilterDocs = await SupplierFilter.find({
                ...filterQuery,
                active: true
            });
            supplierFilters = supplierFilterDocs.map(filter => filter._id);
        }

        const newFormData = await formDataModel.create({
            formType,
            formData,
            userId: userId || null,
            anonymousUserId: anonymousUserId || null,
            status: 'new',
            candidateFilters,
            supplierFilters,
            statusHistory: [{
                status: 'new',
                comment: 'Form submitted by user',
                updatedBy: userId || null,
                updatedAt: new Date()
            }]
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

        const pipeline: any[] = [
            { $match: { isDeleted: false } }
        ];

        // Filter by form type if provided
        if (formType) {
            pipeline[0].$match.formType = formType;
        }

        // Add search functionality in formData
        if (search) {
            pipeline[0].$match.$or = [
                { 'formData.fullName': { $regex: search, $options: 'i' } },
                { 'formData.emailAddress': { $regex: search, $options: 'i' } },
                { 'formData.phoneNumber': { $regex: search, $options: 'i' } },
                { 'formData.businessName': { $regex: search, $options: 'i' } }
            ];
        }

        pipeline.push({ $sort: { createdAt: -1 } });

        // Group by email and formType
        pipeline.push({
            $group: {
                _id: {
                    email: "$formData.emailAddress",
                    formType: "$formType"
                },
                latestForm: { $first: "$$ROOT" },
                totalSubmissions: { $sum: 1 }
            }
        });

        // Replace root with the latest form data
        pipeline.push({
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        "$latestForm",
                        { totalSubmissions: "$totalSubmissions" }
                    ]
                }
            }
        });

        pipeline.push({ $sort: { createdAt: -1 } });

        // Get count for pagination
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await formDataModel.aggregate(countPipeline);
        const count = countResult.length > 0 ? countResult[0].total : 0;

        // Add pagination
        pipeline.push(
            { $skip: req.pagination?.skip || 0 },
            { $limit: req.pagination?.limit || 10 }
        );

        const formData = await formDataModel.aggregate(pipeline);

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
        })
        .populate('candidateFilters')
        .populate('supplierFilters')
        .populate('statusHistory.updatedBy', 'name email');

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

// Get all form submissions for a specific email+formType combination
export const getFormDataDetails = async (req: Request, res: Response) => {
    try {
        const { email, formType } = req.query;

        if (!email || !formType) {
            return res.status(400).json({
                message: "Email and formType are required",
                status: false,
                data: null
            });
        }

        const formDataList = await formDataModel.find({
            'formData.emailAddress': email,
            formType: formType,
            isDeleted: false
        })
        .populate('candidateFilters')
        .populate('supplierFilters')
        .populate('statusHistory.updatedBy', 'name email')
        .sort({ createdAt: -1 });

        if (!formDataList || formDataList.length === 0) {
            return res.status(404).json({
                message: "No form data found for this email and form type",
                status: false,
                data: null
            });
        }

        return res.status(200).json({
            message: "Form data details fetched successfully",
            status: true,
            data: {
                totalSubmissions: formDataList.length,
                submissions: formDataList
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

// Update form status (Admin only)
export const updateFormStatus = async (req: any, res: Response) => {
    try {
        const { status, comment } = req.body;
        const formId = req.params.id;
        const adminUserId = req.user?._id || req.user?.id;

        // Validate required fields
        if (!status || !comment) {
            return res.status(400).json({
                message: "Status and comment are required",
                status: false,
                data: null
            });
        }

        // Validate status values
        const validStatuses = ['new', 'inProgress', 'converted', 'dropped'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Valid statuses are: " + validStatuses.join(', '),
                status: false,
                data: null
            });
        }

        const formData = await formDataModel.findOne({
            _id: formId,
            isDeleted: false
        });

        if (!formData) {
            return res.status(404).json({
                message: "Form data not found",
                status: false,
                data: null
            });
        }

        // Add status history entry
        const statusHistoryEntry = {
            status,
            comment,
            updatedBy: adminUserId,
            updatedAt: new Date()
        };

        // Update form status and add to history
        const updatedFormData = await formDataModel.findByIdAndUpdate(
            formId,
            {
                status,
                $push: { statusHistory: statusHistoryEntry }
            },
            { new: true }
        )
        .populate('candidateFilters')
        .populate('supplierFilters')
        .populate('statusHistory.updatedBy', 'name email');

        return res.status(200).json({
            message: "Form status updated successfully",
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