import { Request, Response } from "express";
import Cart from "../Models/cartModel";
import CandidateCvModel from "../Models/candidateCv";
import userModel from "../Models/userModel";
import Role from "../Models/roleModel";
import masterList from "../Models/masterList";
import mongoose from "mongoose";
import { userRoles } from "../Util/contant";
import { transporter, fromMail } from "../Util/nodemailer";

// Add item to cart (candidate or supplier)
export const addToCart = async (req: any, res: Response) => {
    try {
        const { itemType, itemId, searchContext } = req.body;
        const userId = req.user?.id || null;
        const anonymousUserId = req.body.anonymousUserId || null;

        // Validate required fields
        if (!itemType || !itemId) {
            return res.status(400).json({
                message: "itemType and itemId are required",
                status: false
            });
        }

        if (!userId && !anonymousUserId) {
            return res.status(400).json({
                message: "Either userId or anonymousUserId is required",
                status: false
            });
        }

        // Validate itemType
        if (!['candidate', 'supplier'].includes(itemType)) {
            return res.status(400).json({
                message: "itemType must be either 'candidate' or 'supplier'",
                status: false
            });
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
                message: "Invalid itemId",
                status: false
            });
        }

        // Check if item exists
        let itemExists: any;
        if (itemType === 'candidate') {
            itemExists = await CandidateCvModel.exists({ _id: itemId });
        } else if (itemType === 'supplier') {
            itemExists = await userModel.exists({ _id: itemId, role: 'SupplierAdmin' });
        }

        if (!itemExists) {
            return res.status(404).json({
                message: `${itemType} not found`,
                status: false
            });
        }

        // Check if item already exists in cart
        const existingCartItem = await Cart.findOne({
            userId,
            anonymousUserId,
            itemType,
            itemId,
            active: true
        });

        if (existingCartItem) {
            return res.status(409).json({
                message: "Item already exists in cart",
                status: false,
                data: existingCartItem
            });
        }

        // Create cart item
        const cartItem = await Cart.create({
            userId,
            anonymousUserId,
            itemType,
            itemId,
            searchContext: searchContext || {}
        });

        return res.status(201).json({
            message: "Item added to cart successfully",
            status: true,
            data: cartItem
        });

    } catch (error: any) {
        return res.status(500).json({
            message: "Error adding item to cart",
            status: false,
            error: error.message
        });
    }
};

// Get cart items for user
export const getCartItems = async (req: any, res: Response) => {
    try {
        const userId = req.user?.id || null;
        const anonymousUserId = req.query.anonymousUserId || null;
        const { itemType } = req.query;

        if (!userId && !anonymousUserId) {
            return res.status(400).json({
                message: "Either userId or anonymousUserId is required",
                status: false
            });
        }

        const query: any = { active: true };
        
        if (userId) {
            query.userId = userId;
        } else if (anonymousUserId) {
            query.anonymousUserId = anonymousUserId;
        }

        if (itemType && ['candidate', 'supplier'].includes(itemType)) {
            query.itemType = itemType;
        }

        const cartItems = await Cart.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Populate item details manually
        const populatedItems = await Promise.all(
            cartItems.map(async (item) => {
                let itemDetails = null;
                
                if (item.itemType === 'candidate') {
                    itemDetails = await CandidateCvModel.findById(item.itemId)
                        .populate("roleId", ["name", "type", "parentRoleId", "otherRoles"])
                        .populate("currentRole", ["name", "type", "parentRoleId"])
                        .lean();
                } else if (item.itemType === 'supplier') {
                    itemDetails = await userModel.findById(item.itemId)
                        .select('-password')
                        .lean();
                }

                return {
                    ...item,
                    itemDetails
                };
            })
        );

        return res.status(200).json({
            message: "Cart items fetched successfully",
            status: true,
            data: {
                items: populatedItems,
                total: populatedItems.length
            }
        });

    } catch (error: any) {
        return res.status(500).json({
            message: "Error fetching cart items",
            status: false,
            error: error.message
        });
    }
};

// Remove item from cart
export const removeFromCart = async (req: any, res: Response) => {
    try {
        const { cartItemId } = req.params;
        const userId = req.user?.id || null;
        const anonymousUserId = req.body.anonymousUserId || null;

        if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
            return res.status(400).json({
                message: "Invalid cart item ID",
                status: false
            });
        }

        const query: any = { _id: cartItemId };
        
        if (userId) {
            query.userId = userId;
        } else if (anonymousUserId) {
            query.anonymousUserId = anonymousUserId;
        } else {
            return res.status(400).json({
                message: "Either userId or anonymousUserId is required",
                status: false
            });
        }

        const cartItem = await Cart.findOneAndUpdate(
            query,
            { active: false },
            { new: true }
        );

        if (!cartItem) {
            return res.status(404).json({
                message: "Cart item not found",
                status: false
            });
        }

        return res.status(200).json({
            message: "Item removed from cart successfully",
            status: true,
            data: cartItem
        });

    } catch (error: any) {
        return res.status(500).json({
            message: "Error removing item from cart",
            status: false,
            error: error.message
        });
    }
};

// Mark cart item as engaged
export const markAsEngaged = async (req: any, res: Response) => {
    try {
        const { cartItemId } = req.params;
        const userId = req.user?.id || null;
        const anonymousUserId = req.body.anonymousUserId || null;

        if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
            return res.status(400).json({
                message: "Invalid cart item ID",
                status: false
            });
        }

        const query: any = { _id: cartItemId, active: true };
        
        if (userId) {
            query.userId = userId;
        } else if (anonymousUserId) {
            query.anonymousUserId = anonymousUserId;
        } else {
            return res.status(400).json({
                message: "Either userId or anonymousUserId is required",
                status: false
            });
        }

        const cartItem = await Cart.findOneAndUpdate(
            query,
            { 
                isEngaged: true,
                engagedAt: new Date()
            },
            { new: true }
        );

        if (!cartItem) {
            return res.status(404).json({
                message: "Cart item not found",
                status: false
            });
        }

        return res.status(200).json({
            message: "Item marked as engaged successfully",
            status: true,
            data: cartItem
        });

    } catch (error: any) {
        return res.status(500).json({
            message: "Error marking item as engaged",
            status: false,
            error: error.message
        });
    }
};

// Combined search for candidates and suppliers
export const searchCandidatesAndSuppliers = async (req: any, res: Response) => {
    try {
        const { role, expertise, search, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let candidates: any[] = [];
        let suppliers: any[] = [];

        // Search candidates if role is provided
        if (role) {
            // Find matching roles
            const roleQuery: any = {
                $or: [
                    { name: { $regex: role, $options: "i" } },
                    { otherRoles: { $regex: role, $options: "i" } }
                ],
                isActive: true
            };

            const matchingRoles = await Role.find(roleQuery).lean();
            const roleIds = matchingRoles.map(r => r._id);

            // Build candidate search pipeline
            const candidatePipeline: any[] = [
                {
                    $lookup: {
                        from: "roles",
                        localField: "roleId",
                        foreignField: "_id",
                        as: "roleData"
                    }
                },
                {
                    $lookup: {
                        from: "roles",
                        localField: "currentRole",
                        foreignField: "_id",
                        as: "currentRoleData"
                    }
                }
            ];

            const candidateMatchConditions: any[] = [];

            // Role matching
            if (roleIds.length > 0) {
                candidateMatchConditions.push({
                    $or: [
                        { roleId: { $in: roleIds } },
                        { currentRole: { $in: roleIds } }
                    ]
                });
            }

            // Add search condition for candidate name
            if (search) {
                candidateMatchConditions.push({
                    fullName: { $regex: search, $options: "i" }
                });
            }

            if (candidateMatchConditions.length > 0) {
                candidatePipeline.push({
                    $match: {
                        $and: [
                            { $or: candidateMatchConditions },
                            { active: true }
                        ]
                    }
                });

                candidates = await CandidateCvModel.aggregate([
                    ...candidatePipeline,
                    { $skip: skip },
                    { $limit: parseInt(limit) }
                ]);

                // Add itemType for frontend
                candidates = candidates.map(candidate => ({
                    ...candidate,
                    itemType: 'candidate'
                }));
            }
        }

        // Search suppliers if expertise is provided
        if (expertise) {
            // Find matching expertise
            const expertiseQuery: any = {
                $or: [
                    { name: { $regex: expertise, $options: "i" } },
                    { tags: { $regex: expertise, $options: "i" } }
                ],
                isSystem: true
            };

            const matchingExpertise = await masterList.find(expertiseQuery).lean();
            const expertiseNames = matchingExpertise.map(e => e.name);

            if (expertiseNames.length > 0) {
                const supplierQuery: any = {
                    role: userRoles.SupplierAdmin,
                    active: true,
                    "expertise.name": { $in: expertiseNames }
                };

                // Add search condition for supplier name
                if (search) {
                    supplierQuery.$or = [
                        { name: { $regex: search, $options: "i" } },
                        { companyName: { $regex: search, $options: "i" } }
                    ];
                }

                suppliers = await userModel.find(supplierQuery)
                    .select('-password')
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean();

                // Add itemType for frontend
                suppliers = suppliers.map(supplier => ({
                    ...supplier,
                    itemType: 'supplier'
                }));
            }
        }

        // Combine results
        const combinedResults = [...candidates, ...suppliers];

        // Sort by relevance (you can customize this logic)
        combinedResults.sort((a, b) => {
            // Prioritize exact matches, then by creation date
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return res.status(200).json({
            message: "Search results fetched successfully",
            status: true,
            data: {
                results: combinedResults,
                total: combinedResults.length,
                candidates: candidates.length,
                suppliers: suppliers.length,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });

    } catch (error: any) {
        return res.status(500).json({
            message: "Error searching candidates and suppliers",
            status: false,
            error: error.message
        });
    }
};
