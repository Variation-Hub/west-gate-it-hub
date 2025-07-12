import * as express from 'express';
import {
    addToCart,
    getCartItems,
    removeFromCart,
    markAsEngaged,
    searchCandidatesAndSuppliers
} from '../Controllers/cartController';
import { authorizeRoles } from '../Controllers/Middleware/verifyToken';
import { paginationMiddleware } from '../Controllers/Middleware/pagination';

const cartRoute = express.Router();

// Public routes (for anonymous users)
cartRoute.post("/public/add", addToCart);
cartRoute.get("/public/items", getCartItems);
cartRoute.delete("/public/remove/:cartItemId", removeFromCart);
cartRoute.patch("/public/engage/:cartItemId", markAsEngaged);
cartRoute.get("/public/search", paginationMiddleware, searchCandidatesAndSuppliers);

export default cartRoute;
