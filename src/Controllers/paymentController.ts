import { Request, Response } from "express";
import crypto from 'crypto';

export const generateHash = async (req: Request, res: Response) => {
    try {
        const {
            key,
            txnid,
            amount,
            productinfo,
            firstname,
            email
        } = req.body;

        const salt = 'YOUR_SALT';
        const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
        const hash = crypto.createHash('sha512').update(hashString).digest('hex');

        res.json({ hash });
    } catch (err: any) {
        return res.status(500).json({
            message: err.message,
            status: false,
            data: null
        });
    }
}

// export const addPlanToUser = async (req: Request, res: Response) => {
//     try {
//         const {
//             amount,
//             duration,
//             planDetail,
//             userId,
//         } = req.body;

       
//         res.json({ hash });
//     } catch (err: any) {
//         return res.status(500).json({
//             message: err.message,
//             status: false,
//             data: null
//         });
//     }
// }