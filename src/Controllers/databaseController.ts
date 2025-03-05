import mongoose from "mongoose";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import { format } from "fast-csv";

// Function to fetch all collections from MongoDB
const getCollections = async () => {
    const collections: any = await mongoose?.connection?.db?.listCollections().toArray();
    console.log("collections", collections);
    return collections.map((col: any) => col.name);
};

// Function to export a collection directly to ZIP stream
const exportCollectionToCSV = async (collectionName: string, archive: archiver.Archiver) => {
    return new Promise(async (resolve, reject) => {
        try {
            const collection = mongoose.connection.collection(collectionName);
            const data = await collection.find().toArray();

            if (!data.length) {
                resolve(false); // Skip empty collections
                return;
            }

            // Create CSV stream
            const csvStream = format({ headers: true });
            const csvBuffer: any[] = [];

            csvStream.on("data", chunk => csvBuffer.push(chunk));
            csvStream.on("end", () => {
                // Add CSV buffer to ZIP archive as a file
                archive.append(Buffer.concat(csvBuffer), { name: `${collectionName}.csv` });
                resolve(true);
            });
            csvStream.on("error", reject);

            // Write data to CSV stream
            data.forEach((doc: any) => {
                delete doc._id; // Remove _id field if not needed
                csvStream.write(doc);
            });

            csvStream.end();
        } catch (error) {
            reject(error);
        }
    });
};

// API to export entire database and send as ZIP
export const exportDatabaseToCSV = async (req: any, res: any) => {
    try {
        const collections = await getCollections();

        // Set response headers for ZIP download
        res.setHeader("Content-Disposition", "attachment; filename=database_export.zip");
        res.setHeader("Content-Type", "application/zip");

        // Create ZIP archive stream
        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.pipe(res);

        const exportedFiles: any = [];

        // Export each collection
        for (const collectionName of collections) {
            const exported = await exportCollectionToCSV(collectionName, archive);
            if (exported) exportedFiles.push(collectionName);
        }

        if (exportedFiles.length === 0) {
            return res.status(404).json({ message: "No data found in the database" });
        }

        // Finalize ZIP and send it to response
        archive.finalize();
    } catch (error) {
        console.error("Error exporting database:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
