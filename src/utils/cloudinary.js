import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import process from "process";
import { ApiError } from "./ApiError.js";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath){
            return null;
        }

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //file has been uplaoded successfully
        // console.log("file has uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteFromCloudinary = async (fileUrl) => {

    const extractingFileId = (fileUrl) => {
        const matches = fileUrl.match(/\/upload\/(?:v\d+\/)?([^\.\/]+)/);
        console.log(matches);
        
        return matches ? matches[1] : null;
    }

    const fileId = extractingFileId(fileUrl, (error) => {
        throw new ApiError(error.message, "Failed to delete video file from Cloudinary");
    });
    if(!fileId){
        throw new ApiError(400, {}, "Invalid file URL, unable to extract file ID");
    }
    // console.log("fileId: ",fileId);

    try {
        await cloudinary.uploader.destroy(fileId);
    } catch (error) {
        throw new ApiError(error, "Failed to delete file from cloudinary!!! please try again")
    }
}

const deleteVideoFromCloudinary = async (fileUrl) => {

    const extractingFileId = (fileUrl) => {
        const matches = fileUrl.match(/\/upload\/(?:v\d+\/)?([^\.\/]+)/);
        console.log(matches);
        
        return matches ? matches[1] : null;
    }

    const fileId = extractingFileId(fileUrl);
    if(!fileId){
        throw new ApiError(400, {}, "Invalid file URL, unable to extract file ID");
    }
    // console.log("fileId: ",fileId);

    try {
        await cloudinary.uploader.destroy(fileId, { resource_type: "video" }, (error) => {
            if (error) {
                throw new ApiError(error.message, "Failed to delete video file from Cloudinary");
            }});
    } catch (error) {
        throw new ApiError(error, "Failed to delete video from cloudinary!!! please try again")
    }
}


export { uploadOnCloudinary , deleteFromCloudinary, deleteVideoFromCloudinary}