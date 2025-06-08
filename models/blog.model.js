import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        maxLength: [60, "Title length must not exceed 60 characters"],
        minLength: [3, "Title length not less than 3 characters"]
    },
    slug: {
        type: String,
        required: [true, "slug value is required"],
        trim: true,
        maxLength: [70, "Slug length must not exceed 70 characters"],
        minLength: [3, "Slug length not less than 3 characters"]
    },
    content: {
        type: String,
        required: [true, "Content is required"],
        trim: true,
        maxLength: [8000, "content length must not exceed 8000 characters"],
        minLength: [3, "content length not less than 3 characters"]
    },
    status: {
        type: String,
        enum : {
            values: ["active", "inactive"],
            message: "Please select a valid status"
        },
        default: "inactive"
    },
    image: {
        type: String,
        required: [true, "Image is required"]
    },
    imageId: {
        type: String,
        required: [true, "Image id is required"],
        select: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Owner ref is required"]
    }

}, {
    timestamps : true
})

export const Blog = mongoose.model("Blog", blogSchema)