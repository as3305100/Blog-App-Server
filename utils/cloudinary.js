import fs from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { ApiError } from "../middlewares/error.middleware.js";

dotenv.config();

cloudinary.config({
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  cloud_name: process.env.CLOUD_NAME,
});

export const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("❌ File deletion error:", error);
    throw new ApiError(500, "Error occurred while deleting file");
  }
};

export const uploadFile = async (localFilePath) => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });
    try {
      await fs.unlink(localFilePath);
    } catch (err) {
      await deleteFile(uploadResponse.public_id);
      console.warn(
        "⚠️ Warning: Failed to delete file from server after upload and may be file from cloud deleted",
        err
      );
    }
    return {
      public_id: uploadResponse.public_id,
      url: uploadResponse.secure_url,
    };
  } catch (error) {
    await fs.unlink(localFilePath).catch((fsError) => {
      console.warn("⚠️ Warning: Failed to delete local file after failed upload:", fsError);
    });
    console.error("File upload error:", error);
    throw ApiError(500, "Error occured while uploading the file");
  }
};
