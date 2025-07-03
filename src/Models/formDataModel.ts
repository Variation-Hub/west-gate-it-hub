import mongoose, { Schema, Document } from 'mongoose';

export interface IFormData extends Document {
    formType: string;
    formData: {
        [key: string]: any;
    };
    userId?: mongoose.Types.ObjectId;
    anonymousUserId?: string;
    status: string;
    statusHistory: Array<{
        status: string;
        comment: string;
        updatedBy: mongoose.Types.ObjectId | null;
        updatedAt: Date;
    }>;
    candidateFilters: Array<mongoose.Types.ObjectId>;
    supplierFilters: Array<mongoose.Types.ObjectId>;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const formDataSchema = new Schema({
    formType: {
        type: String,
        required: true,
        enum: [
            'workAwayForm',
            'e2eQaServiceForm',
            'e2eQaResourceForm',
            'itSubcontractForm',
            'itSubcontractingDeckForm',
            'contactUsForm'
        ]
    },
    formData: {
        type: Schema.Types.Mixed,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    anonymousUserId: {
        type: String,
        required: false,
        default: null
    },
    status: {
        type: String,
        enum: ['new', 'inProgress', 'converted', 'dropped'],
        default: 'new'
    },
    statusHistory: [{
        status: {
            type: String
        },
        comment: {
            type: String
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
            default: null,
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    candidateFilters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CandidateFilter'
    }],
    supplierFilters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupplierFilter'
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model<IFormData>('FormData', formDataSchema); 