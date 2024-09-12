import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
// import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import mime from "mime-types";
import B2 from 'backblaze-b2';
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION!,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
//   }
// });

interface FileData {
  originalname: string;
  buffer: Buffer;
}


// export const uploadToS3 = async (fileData: FileData, folderName: string) => {
//   try {
//     const contentType = mime.lookup(fileData.originalname) || "application/octet-stream";
//     const key = `${folderName}/${Date.now()}_${fileData.originalname}`

//     const params = {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: key,
//       Body: fileData.buffer,
//       ContentType: contentType,
//     };

//     const uploadCommand = new PutObjectCommand(params);
//     await s3Client.send(uploadCommand);

//     const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;

//     return {
//       key,
//       url: s3Url,
//     };

//   } catch (error) {
//     console.error("Error uploading file:", error);
//     throw error;
//   }
// };

// export const uploadMultipleFilesToS3 = async (files: FileData[], folderName: string) => {
//   try {
//     const uploadResults = [];

//     for (const file of files) {
//       const result = await uploadToS3(file, folderName);
//       uploadResults.push(result);
//     }

//     console.log("All files uploaded successfully:", uploadResults);

//     return uploadResults;
//   } catch (error) {
//     console.error("Error uploading files:", error);
//     throw error;
//   }
// }

interface S3Object {
  key: string;
}


// export const deleteFromS3 = async (obj: S3Object) => {
//   const key = obj.key
//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: key,
//   };

//   try {
//     const deleteCommand = new DeleteObjectCommand(params);
//     const response = await s3Client.send(deleteCommand);

//     return response;
//   } catch (error) {
//     console.error("Error deleting file:", error);
//     throw error;
//   }
// };

// export const deleteMultipleFromS3 = async (keys: string[]) => {
//   const objectsToDelete = keys.map((key) => ({ Key: key }));

//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Delete: {
//       Objects: objectsToDelete,
//       Quiet: false,
//     },
//   };

//   try {
//     const deleteCommand = new DeleteObjectsCommand(params);
//     const response = await s3Client.send(deleteCommand);

//     console.log("Files deleted successfully:", response.Deleted);
//     return response;
//   } catch (error) {
//     console.error("Error deleting files:", error);
//     throw error;
//   }
// };


// Azure services
// const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
// const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
// const containerName = process.env.AZURE_CONTAINER_NAME;

// export const uploadToAzureBlob = async (fileData: FileData, folderName: string) => {
//   try {

//     if (!accountName || !accountKey || !containerName) {
//       console.log("Azure storage account name, key or container name is not set in environment variables.");
//       return
//     }

//     const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
//     const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);
//     const containerClient = blobServiceClient.getContainerClient(containerName);

//     const contentType = mime.lookup(fileData.originalname) || "application/octet-stream";
//     const blobName = `${folderName}/${Date.now()}_${fileData.originalname}`;
//     const blockBlobClient = containerClient.getBlockBlobClient(blobName);

//     const uploadBlobResponse = await blockBlobClient.upload(fileData.buffer, fileData.buffer.length, {
//       blobHTTPHeaders: { blobContentType: contentType }
//     });

//     const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;

//     return {
//       key: blobName,
//       url: blobUrl,
//     };
//   } catch (error) {
//     console.error("Error uploading file to Azure Blob Storage:", error);
//     throw false;
//   }
// };

// export const uploadMultipleFilesToAzureBlob = async (files: FileData[], folderName: string) => {
//   try {

//     if (!accountName || !accountKey || !containerName) {
//       // throw new Error("Azure storage account name, key, or container name is not set in environment variables.");
//       return
//     }

//     const uploadResults = [];

//     for (const file of files) {
//       const result = await uploadToAzureBlob(file, folderName);
//       uploadResults.push(result);
//     }

//     return uploadResults;
//   } catch (error) {
//     console.error("Error uploading files to Azure Blob Storage:", error);
//     throw error;
//   }
// };

// export const deleteFromAzureBlob = async (obj: S3Object) => {
//   try {
//     if (!accountName || !accountKey || !containerName) {
//       throw new Error("Azure storage account name, key or container name is not set in environment variables.");
//     }

//     const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
//     const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);
//     const containerClient = blobServiceClient.getContainerClient(containerName);

//     const blobName = obj.key;
//     const blockBlobClient = containerClient.getBlockBlobClient(blobName);

//     const deleteBlobResponse = await blockBlobClient.delete();

//     return deleteBlobResponse;
//   } catch (error) {
//     console.error("Error deleting blob from Azure Blob Storage:", error);
//     // throw error;
//   }
// };

// export const deleteMultipleFromAzureBlob = async (keys: string[]) => {
//   try {

//     if (!accountName || !accountKey || !containerName) {
//       // throw new Error("Azure storage account name, key, or container name is not set in environment variables.");
//       return
//     }

//     const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
//     const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);
//     const containerClient = blobServiceClient.getContainerClient(containerName);

//     const deleteResponses = [];

//     for (const key of keys) {
//       const blobName = key; // Assuming key includes the folder path if needed
//       const blockBlobClient = containerClient.getBlockBlobClient(blobName);
//       const deleteResponse = await blockBlobClient.delete();
//       deleteResponses.push(deleteResponse);
//     }

//     return deleteResponses;
//   } catch (error) {
//     console.error("Error deleting files from Azure Blob Storage:", error);
//     // throw error;
//   }
// };

// blackblaze services

export const uploadToBackblazeB2 = async (fileData: FileData, folderName: string) => {
  try {
    const b2 = new B2({
      applicationKeyId: process.env.B2_APPLICATION_KEY_ID as string,
      applicationKey: process.env.B2_APPLICATION_KEY as string
    });

    await b2.authorize();

    const bucketId = process.env.B2_BUCKET_ID as string;

    const contentType = mime.lookup(fileData.originalname) || "application/octet-stream";
    const fileName = `${folderName}/${Date.now()}_${fileData.originalname}`;

    const uploadUrlResponse = await b2.getUploadUrl({
      bucketId: bucketId
    });

    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: fileName,
      data: fileData.buffer,
      mime: contentType
    });

    const fileUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`;

    return {
      key: fileName,
      url: fileUrl,
      fileName: fileData.originalname
    };
  } catch (error) {
    console.error("Error uploading file to Backblaze B2:", error);
    throw error;
  }
};

export const uploadMultipleFilesBackblazeB2 = async (files: FileData[], folderName: string) => {
  try {

    const uploadResults = [];

    for (const file of files) {
      const result = await uploadToBackblazeB2(file, folderName);
      uploadResults.push(result);
    }

    return uploadResults;
  } catch (error) {
    throw error;
  }
};

export const deleteFromBackblazeB2 = async (obj: S3Object) => {
  try {
    const b2 = new B2({
      applicationKeyId: process.env.B2_APPLICATION_KEY_ID as string,
      applicationKey: process.env.B2_APPLICATION_KEY as string
    });

    await b2.authorize();

    const bucketId = process.env.B2_BUCKET_ID as string;
    const fileName = obj.key;

    // Get file ID required for deletion
    const fileInfoResponse = await b2.listFileNames({
      bucketId,
      prefix: fileName,
      maxFileCount: 1,
      startFileName: fileName,
      delimiter: ''
    });


    if (fileInfoResponse.data.files.length === 0) {
      return false
    }

    const fileId = fileInfoResponse.data.files[0].fileId;

    const deleteFileResponse = await b2.deleteFileVersion({
      fileId,
      fileName
    });

    return deleteFileResponse;
  } catch (error) {
    console.error("Error deleting file from Backblaze B2:", error);
    // throw error;
  }
};

export const deleteMultipleFromBackblazeB2 = async (keys: string[]) => {
  try {
    const b2 = new B2({
      applicationKeyId: process.env.B2_APPLICATION_KEY_ID as string,
      applicationKey: process.env.B2_APPLICATION_KEY as string
    });

    await b2.authorize();

    const bucketId = process.env.B2_BUCKET_ID as string;
    const deleteResponses = [];

    for (const key of keys) {
      const fileName = key;

      const fileInfoResponse = await b2.listFileNames({
        bucketId,
        prefix: fileName,
        maxFileCount: 1,
        startFileName: fileName,
        delimiter: ''
      });

      if (fileInfoResponse.data.files.length === 0) {
        console.error(`File with key ${fileName} not found in Backblaze B2.`);
        continue;
      }

      const fileId = fileInfoResponse.data.files[0].fileId;

      const deleteFileResponse = await b2.deleteFileVersion({
        fileId,
        fileName
      });

      deleteResponses.push(deleteFileResponse);
    }

    return deleteResponses;
  } catch (error) {
    console.error("Error deleting files from Backblaze B2:", error);
    // throw error;
  }
};

