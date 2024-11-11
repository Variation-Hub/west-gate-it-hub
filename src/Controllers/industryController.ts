import { Request, Response } from "express"
import industryModel from "../Models/industryModel";
import categoryModel from "../Models/categoryModel";

export const createIndustry = async (req: any, res: Response) => {
    try {
        let { industry } = req.body;

        const Industry = await industryModel.findOne({ industry })

        if (Industry) {
            return res.status(402).json({
                message: "Industry already exists",
                status: false,
                data: null
            })
        }

        const newIndustry = await industryModel.create({ industry });

        return res.status(200).json({
            message: "Industry created successfully",
            status: true,
            data: newIndustry
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

// const createIndustrym = async () => {
//     try {
//         const dataC =
//             [
//                 { "category": "Software Development" },
//                 { "category": "Networking" },
//                 { "category": "Cybersecurity" },
//                 { "category": "Data Management" },
//                 { "category": "Cloud Computing" },
//                 { "category": "IT Support" },
//                 { "category": "Artificial Intelligence" },
//                 { "category": "Web Development" },
//                 { "category": "Systems Integration" },
//                 { "category": "IT Management" },
//                 { "category": "Hardware" },
//                 { "category": "IT Compliance & Standards" },
//                 { "category": "Digital Media & Content" },
//                 { "category": "Emerging Technologies" },
//                 { "category": "Mobile Development" },
//                 { "category": "Game Development" },
//                 { "category": "DevOps" },
//                 { "category": "Database Development" },
//                 { "category": "Software Testing & QA" },
//                 { "category": "UI/UX Design" },
//                 { "category": "Blockchain Technology" },
//                 { "category": "Internet of Things (IoT)" },
//                 { "category": "Data Analytics" },
//                 { "category": "Business Intelligence" },
//                 { "category": "Robotics" },
//                 { "category": "Wireless Networking" },
//             ]
//         const dataI = [
//             { "industry": "Industry" },
//             { "industry": "Aerospace" },
//             { "industry": "Agriculture" },
//             { "industry": "Automotive" },
//             { "industry": "Banking & Finance" },
//             { "industry": "Biotechnology" },
//             { "industry": "Chemicals" },
//             { "industry": "Construction" },
//             { "industry": "Consumer Goods" },
//             { "industry": "Defence" },
//             { "industry": "Education" },
//             { "industry": "Energy" },
//             { "industry": "Engineering" },
//             { "industry": "Entertainment & Media" },
//             { "industry": "Food & Beverage" },
//             { "industry": "Government" },
//             { "industry": "Healthcare" },
//             { "industry": "Hospitality" },
//             { "industry": "Information Technology (IT)" },
//             { "industry": "Insurance" },
//             { "industry": "Manufacturing" },
//             { "industry": "Mining" },
//             { "industry": "Non-profit" },
//             { "industry": "Pharmaceuticals" },
//             { "industry": "Retail" },
//             { "industry": "Telecommunications" },
//             { "industry": "Transportation & Logistics" },
//             { "industry": "Utilities" },
//             { "industry": "Real Estate" },
//             { "industry": "Sports" },
//             { "industry": "Environmental" },
//             { "industry": "Legal" },
//             { "industry": "Fashion" },
//             { "industry": "Travel & Tourism" },
//             { "industry": "Gaming" },
//             { "industry": "Advertising & Marketing" },
//             { "industry": "Architecture & Design" },
//             { "industry": "Research & Development" },
//             { "industry": "Social Services" },
//             { "industry": "Human Resources" },
//             { "industry": "Public Relations" },
//             { "industry": "Consulting" },
//             { "industry": "Space Exploration" },
//             { "industry": "Marine" },
//             { "industry": "Veterinary" },
//             { "industry": "Photography" },
//             { "industry": "Fine Arts" },
//             { "industry": "Renewable Energy" },
//             { "industry": "Waste Management" },
//             { "industry": "Music" },
//             { "industry": "Religious Institutions" },
//             { "industry": "Aviation" },
//             { "industry": "Interior Design" },
//             { "industry": "Event Management" },
//             { "industry": "Journalism" },
//             { "industry": "Cryptocurrency & Blockchain" },
//             { "industry": "Cybersecurity" },
//         ]
//         const newIndustry = await categoryModel.insertMany(dataC);
//         await industryModel.insertMany(dataI);


//     } catch (error: any) {

//     }
// }
// createIndustrym()
export const getIndustryList = async (req: any, res: Response) => {
    try {

        const Industry = await industryModel.find()

        return res.status(200).json({
            message: "Industry fetched successfully",
            status: true,
            data: Industry
        })

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}

export const updateIndustry = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const obj = req.body;

        const Industry: any = await industryModel.findById(id);

        if (!Industry) {
            return res.status(404).json({
                message: "Industry not found",
                status: false,
                data: null
            });
        }

        Object.keys(obj).forEach(value => {
            Industry[value] = obj[value];
        });

        await Industry.save();

        return res.send({
            message: "Industry updated successfully",
            status: true,
            data: Industry
        })
    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        });
    }
}
export const deleteIndustry = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const Industry = await industryModel.findByIdAndDelete(id);
        if (!Industry) {
            return res.status(404).json({
                message: "Industry not found",
                status: false,
                data: null
            });
        }
        return res.status(200).json({
            message: "Industry delete success",
            status: true,
            data: Industry
        });

    } catch (error: any) {
        return res.status(500).json({
            message: error.message,
            status: false,
            data: null
        })
    }
}
