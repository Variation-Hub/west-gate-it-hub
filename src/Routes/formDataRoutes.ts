import express from 'express';
import { createFormData, getFormDataList, getFormDataById, getFormDataDetails, updateFormData, updateFormStatus, deleteFormData } from '../Controllers/formDataController';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';

const router = express.Router();

// Create new form data
router.post('/', createFormData);

// Get all form data with pagination and search
router.get('/', paginationMiddleware, getFormDataList);

// Get form data details all submissions
router.get('/details', getFormDataDetails);

// Get single form data by ID
router.get('/:id', getFormDataById);

// Update form data
router.put('/:id', updateFormData);

// Update form status (Admin only)
router.patch('/:id/status', authorizeRoles('Admin'), updateFormStatus);

// Delete form data
router.delete('/:id', deleteFormData);

export default router; 