import { NextFunction, Request, Response } from "express";
import { CustomRequest } from "../Util/types/expressInterface";

const jwt = require("jsonwebtoken");

const secret = process.env.SECRET_KEY

export const authorizeRoles = (req: any, res: Response, next: NextFunction) => {
    const BearerToken = req.header('authorization');

    if (BearerToken) {
        const tokenResult = jwt.verify(BearerToken.slice(7), secret, (err: Error, decoded: any) => {
            if (err) {
                return null;
            } else {
                return decoded;
            }
        });

        if (!tokenResult) {
            return res.status(401).json({
                message: "Invalid token",
                status: false
            });
        }

        const currentUnixTime = Math.floor(Date.now() / 1000);
        const { exp } = tokenResult;

        if (currentUnixTime > exp) {
            return res.status(401).json({
                message: "Token expired",
                status: false
            });
        }

        req.user = tokenResult;
    } else {
        return res.status(401).json({
            message: "Unauthorized",
            status: false
        });
    }

    next();
};