import mongoose from "mongoose";

const CartSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: false, 
        default: null 
    },
    anonymousUserId: { 
        type: String, 
        required: false, 
        default: null 
    },
    itemType: {
        type: String,
        enum: ['candidate', 'supplier'],
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'itemType'
    },
    //  Store additional context for the cart item
    // searchContext: {
    //     role: { type: String, default: "" },
    //     expertise: { type: String, default: "" },
    //     searchQuery: { type: String, default: "" }
    // },
    // Track engagement status
    // isEngaged: {
    //     type: Boolean,
    //     default: false
    // },
    // engagedAt: {
    //     type: Date,
    //     default: null
    // },
    active: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true, 
    versionKey: false 
});

// Compound indexes for efficient queries
CartSchema.index({ userId: 1, active: 1 });
CartSchema.index({ anonymousUserId: 1, active: 1 });
CartSchema.index({ itemType: 1, itemId: 1 });
CartSchema.index({ userId: 1, anonymousUserId: 1, itemType: 1, itemId: 1, active: 1 }, { unique: true });

// Virtual populate for candidates
CartSchema.virtual('candidateDetails', {
    ref: 'CandidateCV',
    localField: 'itemId',
    foreignField: '_id',
    justOne: true,
    match: { itemType: 'candidate' }
});

// Virtual populate for suppliers
CartSchema.virtual('supplierDetails', {
    ref: 'users',
    localField: 'itemId',
    foreignField: '_id',
    justOne: true,
    match: { itemType: 'supplier' }
});

CartSchema.set('toJSON', { virtuals: true });
CartSchema.set('toObject', { virtuals: true });

const Cart = mongoose.model("Cart", CartSchema);
export default Cart;
