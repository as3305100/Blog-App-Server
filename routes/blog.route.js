import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { upload } from "../utils/multer.js";
import { blogValidtion } from "../middlewares/validation.middleware.js";
import { createBlog, deleteBlog, getAllActiveBlogs, getBlog, getMyBlogs, updateBlog } from "../controllers/blog.controller.js";

const router = express.Router()

router.post("/blog", isAuthenticated, upload.single("image"), blogValidtion, createBlog)

router.patch("/update-blog/:blogId", isAuthenticated, upload.single("image"), blogValidtion, updateBlog)

router.get("/blog/:blogId", isAuthenticated, getBlog)

router.get("/my-blogs", isAuthenticated, getMyBlogs)

router.get("/active-blogs", isAuthenticated, getAllActiveBlogs)

router.delete("/blog/:blogId", isAuthenticated, deleteBlog)

export default router