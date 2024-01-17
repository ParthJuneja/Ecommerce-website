import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  try{
    if (!filePath) return;
    // upload
    const uploadedImage = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      use_filename: true,
    });
    //uploaded successfully
    console.log("Uploaded successfully", response.url);
    
    if (uploadedImage) {
      // remove file from server
      fs.unlinkSync(filePath);
      return uploadedImage;
    }
    return response;
  }
  catch (error){
    fs.unlinkSync(filePath);
    //remove local file if upload failed
    console.log(error);
    return null;
  }
}

export {uploadOnCloudinary};