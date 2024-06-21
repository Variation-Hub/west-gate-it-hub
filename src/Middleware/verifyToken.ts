import jwt from 'jsonwebtoken';
import { Response, NextFunction } from "express";

const secret = process.env.SECRET_KEY as string;

export const authorizeRoles = (...roles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        const BearerToken: string | undefined = req.header('authorization');

        if (BearerToken) {
            const tokenResult: any = jwt.verify(BearerToken.slice(7), secret, (err: any, decoded: any) => {
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

            const userRole: string | null = tokenResult.role;

            if (!userRole || (!roles.includes(userRole) && roles.length > 0)) {
                return res.status(403).json({
                    status: false,
                    message: `Role: ${userRole} is not allowed to access this resource`
                });
            }
            req.tokenrole = tokenResult.role;
            req.user = tokenResult;
        } else {
            return res.status(401).json({
                message: "Unauthorized",
                status: false
            });
        }

        next();
    };
};

export const authorizeRolesWithoutError = (...roles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        const BearerToken: string | undefined = req.header('authorization');

        if (BearerToken) {
            const token = BearerToken.slice(7);
            jwt.verify(token, secret, (err: any, decoded: any) => {
                if (err) {
                    return next();
                }

                req.user = decoded;

                next();
            });
        } else {
            next();
        }
    };
};
