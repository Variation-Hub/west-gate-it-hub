import express from 'express';
import { createFormData, getFormDataList, getFormDataById, updateFormData, deleteFormData } from '../Controllers/formDataController';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';

const router = express.Router();

// Create new form data
router.post('/', createFormData);

// Get all form data with pagination and search
router.get('/', paginationMiddleware, getFormDataList);

// Get single form data by ID
router.get('/:id', getFormDataById);

// Update form data
router.put('/:id', updateFormData);

// Delete form data
router.delete('/:id', deleteFormData);

export default router; 