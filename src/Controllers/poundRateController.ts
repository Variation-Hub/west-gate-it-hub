import { Request, Response } from 'express';
import PoundRateSettings from '../Models/poundRateSettings';

export const getLatestPoundRate = async (req: Request, res: Response) => {
    try {
        const latestRate = await PoundRateSettings.findOne().sort({ updatedAt: -1 });

        if (!latestRate) {
            return res.status(404).json({
                message: "No pound rate found. Please set a rate first.",
                status: false,
                data: null
            });
        }

        return res.status(200).json({
            message: "Latest pound rate retrieved successfully",
            status: true,
            data: {
                id: latestRate._id,
                rate: latestRate.rate,
                updatedAt: latestRate.updatedAt
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Error retrieving pound rate",
            status: false,
            error: error.message
        });
    }
};

export const createOrUpdatePoundRate = async (req: Request, res: Response) => {
    try {
        const { rate } = req.body;

        if (!rate || rate <= 0) {
            return res.status(400).json({
                message: "Rate is required and must be a positive number",
                status: false
            });
        }

        const existingRate = await PoundRateSettings.findOne();

        let result;
        if (existingRate) {
            result = await PoundRateSettings.findByIdAndUpdate(
                existingRate._id,
                { rate, updatedAt: new Date() },
                { new: true }
            );
        } else {
            result = await PoundRateSettings.create({ rate });
        }

        return res.status(200).json({
            message: "Pound rate updated successfully",
            status: true,
            data: {
                id: result!._id,
                rate: result!.rate,
                updatedAt: result!.updatedAt
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            message: "Error updating pound rate",
            status: false,
            error: error.message
        });
    }
};


