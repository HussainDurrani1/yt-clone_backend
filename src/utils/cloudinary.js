import { v2 as cloudinary } from 'cloudinary'
import fs from 'node:fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // console.log(localFilePath);
        const uploadResult = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })
        // console.log('File uploaded successfully on cloudinary.');
        // console.log(uploadResult);
        // console.log(uploadResult.url);
        fs.unlinkSync(localFilePath);
        return uploadResult.url;
    } catch (error) {
        // fs.unlinkSync(localFilePath);
        console.log(`Cloudinary upload error: ${uploadResult}`);
        return null;
    }
}


export { uploadOnCloudinary }