import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import mime from "mime-types";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

interface FileData {
  originalname: string;
  buffer: Buffer;
}


export const uploadToS3 = async (fileData: FileData, folderName: string) => {
  try {
    const contentType = mime.lookup(fileData.originalname) || "application/octet-stream";
    const key = `${folderName}/${Date.now()}_${fileData.originalname}`

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileData.buffer,
      ContentType: contentType,
    };

    const uploadCommand = new PutObjectCommand(params);
    await s3Client.send(uploadCommand);

    const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;

    return {
      key,
      url: s3Url,
    };

  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const uploadMultipleFilesToS3 = async (files: FileData[], folderName: string) => {
  try {
    const uploadResults = [];

    for (const file of files) {
      const result = await uploadToS3(file, folderName);
      uploadResults.push(result);
    }

    console.log("All files uploaded successfully:", uploadResults);

    return uploadResults;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
}

interface S3Object {
  key: string;
}


export const deleteFromS3 = async (obj: S3Object) => {
  const key = obj.key
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    const deleteCommand = new DeleteObjectCommand(params);
    const response = await s3Client.send(deleteCommand);

    return response;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

export const deleteMultipleFromS3 = async (keys: string[]) => {
  const objectsToDelete = keys.map((key) => ({ Key: key }));

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Delete: {
      Objects: objectsToDelete,
      Quiet: false,
    },
  };

  try {
    const deleteCommand = new DeleteObjectsCommand(params);
    const response = await s3Client.send(deleteCommand);

    console.log("Files deleted successfully:", response.Deleted);
    return response;
  } catch (error) {
    console.error("Error deleting files:", error);
    throw error;
  }
};