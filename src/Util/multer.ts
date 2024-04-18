import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const singleFileUpload = (fieldName: string) => {
    return upload.single(fieldName);
};

export const multipleFileUpload = (fieldName: string, maxCount: number) => {
    return upload.array(fieldName, maxCount);
};
