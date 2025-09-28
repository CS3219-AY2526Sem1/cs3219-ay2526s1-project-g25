import cloudinary from "cloudinary";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    cloud_name: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_API_SECRET
})

export const cloudinaryClient = cloudinary.v2;
