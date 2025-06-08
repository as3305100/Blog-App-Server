import { Blog } from "../models/blog.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError, handleAsync } from "../middlewares/error.middleware.js";
import { uploadFile, deleteFile } from "../utils/cloudinary.js";
import { safeUnlink } from "../utils/safeUnlink.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

export const createBlog = handleAsync(async (req, res) => {
  const { title, slug, content, status = "inactive" } = req.validated;
  const imageLocalPath = req?.file?.path;
  const userId = req.userId;

  if (imageLocalPath) {
    throw new ApiError(400, "Image is required");
  }

  const user = await User.findById(userId).lean();

  if (!user) {
    await safeUnlink(imageLocalPath);
    throw new ApiError(404, "User not found");
  }

  const existedBlog = await Blog.findOne({ slug, owner: userId });

  if (existedBlog) {
    await safeUnlink(imageLocalPath);
    throw new ApiError(400, "Blog is existed with the same slug value");
  }

  const { public_id, url } = await uploadFile(imageLocalPath);

  const newBlog = await Blog.create({
    title,
    slug,
    content,
    status,
    image: url,
    imageId: public_id,
    owner: userId,
  });

  return new ApiResponse(201, "Blog created successfully", newBlog).send(res);
});

export const updateBlog = handleAsync(async (req, res) => {
  const blogId = req?.params?.blogId;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    throw new ApiError(400, "Please send a valid id");
  }

  const { title, slug, content, status = "inactive" } = req.validated;

  const imageLocalPath = req?.file?.path;

  const blog = await Blog.findOne({ _id: blogId, owner: userId }).select(
    "+imageId"
  );

  if (!blog) {
    if (imageLocalPath) await safeUnlink(imageLocalPath);
    throw new ApiError(404, "blog not found");
  }

  const existedSlugBlog = await Blog.findOne({ slug, owner: userId });

  if (
    existedSlugBlog &&
    existedSlugBlog._id.toString() !== blog._id.toString()
  ) {
    if (imageLocalPath) await safeUnlink(imageLocalPath);
    throw new ApiError(
      400,
      "Blog is already existed with the same slug in your collection"
    );
  }

  let previousId = blog.imageId;

  if (imageLocalPath) {
    const { public_id, url } = await uploadFile(imageLocalPath);
    blog.image = url;
    blog.imageId = public_id;
  }

  blog.title = title;
  blog.slug = slug;
  blog.content = content;
  blog.status = status;

  await blog.save();

  if (imageLocalPath && previousId) {
    await deleteFile(previousId);
  }

  const blogObj = blog.toObject();
  delete blogObj.imageId;

  return new ApiResponse(200, "Blog updated successfully", blogObj).send(res);
});

export const getBlog = handleAsync(async (req, res) => {
  const blogId = req?.params?.blogId;

  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    throw new ApiError(400, "Invalid blogId");
  }

  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  return new ApiResponse(200, "Blog data fetched successfully", blog).send(res);
});

export const getMyBlogs = handleAsync(async (req, res) => {
  const userId = req.userId;
  const { limit = 10, page = 1 } = req.query;

  const parsedLimit = Math.min(30, Number(limit)) || 10;
  const parsedPage = Math.max(1, Number(page)) || 1;

  const skip = (parsedPage - 1) * parsedLimit;

  const [blogs, totalBlogs] = await Promise.all([
    Blog.aggregate([
      {
        $match: {
          owner: mongoose.Types.ObjectId(userId),
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: parsedLimit,
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                _id: 1,
                fullname: 1,
                avatar: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $arrayElemAt: ["$owner", 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          content: 1,
          status: 1,
          owner: 1,
          image: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]),
    Blog.countDocuments({ owner: userId }),
  ]);

  const hasMore = parsedPage * parsedLimit < totalBlogs;

  return new ApiResponse(200, "Blogs fetched successfully", {
    blogs,
    page: parsedPage,
    limit: parsedLimit,
    hasMore,
  }).send(res);
});

export const getAllActiveBlogs = handleAsync(async (req, res) => {

  const { limit = 10, page = 1 } = req.query;

  const parsedLimit = Math.min(30, Number(limit)) || 10;
  const parsedPage = Math.max(1, Number(page)) || 1;

  const skip = (parsedPage - 1) * parsedLimit;

  const [blogs, totalBlogs] = await Promise.all([
    Blog.aggregate([
      {
        $match: {
          status: "active"
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: parsedLimit,
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                _id: 1,
                fullname: 1,
                avatar: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $arrayElemAt: ["$owner", 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          content: 1,
          status: 1,
          owner: 1,
          image: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]),
    Blog.countDocuments({ status: "active" }),
  ]);

  const hasMore = parsedPage * parsedLimit < totalBlogs;

  return new ApiResponse(200, "Blogs fetched successfully", {
    blogs,
    page: parsedPage,
    limit: parsedLimit,
    hasMore,
  }).send(res);
});

export const deleteBlog = handleAsync(async (req, res) => {
    const blogId = req?.params?.blogId
    const userId = req.userId

    if(!mongoose.Types.ObjectId.isValid(blogId)){
        throw new ApiError(400, "Invalid blog id")
    }

    const blog = await Blog.findOne({_id: blogId, owner: userId}).select("+imageId")

    if(!blog) {
        throw new ApiError(404, "Blog not found")
    }

    await deleteFile(blog.imageId)

    await blog.deleteOne()

    return new ApiResponse(200, "Blog deleted successfully").send(res)
});
