import mongoose, { Schema, Document } from 'mongoose';

export interface IFormData extends Document {
    formType: string;
    formData: {
        [key: string]: any;
    };
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
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model<IFormData>('FormData', formDataSchema); 