import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError, handleAsync } from "../middlewares/error.middleware.js";
import { safeUnlink } from "../utils/safeUnlink.js";
import { User } from "../models/user.model.js";
import { uploadFile, deleteFile } from "../utils/cloudinary.js";

export const createUser = handleAsync(async (req, res) => {
  const { fullname, email, password } = req.validated;
  const avatar = req?.file?.path;

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    await safeUnlink(avatar);
    throw new ApiError(400, "User already exists. Please log in.");
  }

  const { public_id, url } = await uploadFile(avatar);

  const user = await User.create({
    fullname,
    password,
    email,
    avatar: url,
    avatarId: public_id,
  });

  user.password = undefined;
  user.avatarId = undefined;

  return new ApiResponse(201, "User created successfully", user).send(res);
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

const generateAccessRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId).select("+refreshToken");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.getAccessToken();
    const refreshToken = user.getRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error occured while generating the tokens");
  }
};

export const loginUser = handleAsync(async (req, res) => {
  const { email, password } = req.validated;

  const existedUser = await User.findOne({ email });

  if (!existedUser) {
    throw new ApiError(404, "User not found. Please signup first.");
  }

  const passwordValidation = await existedUser.comparePassword(password);

  if (!passwordValidation) {
    throw new ApiError(400, "Invalid Password");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    existedUser._id
  );

  const userInfo = {
    _id: existedUser._id,
    fullname: existedUser.fullname,
    email: existedUser.email,
    avatar: existedUser.avatar,
  };

  res
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 4 * 60 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

  return new ApiResponse(200, "User login successfull", userInfo).send(res);
});

export const getUserProfile = handleAsync(async (req, res) => {
  const userId = req.userId;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return new ApiResponse(
    200,
    "User information fetched successfully",
    user
  ).send(res);
});

export const updateUserProfile = handleAsync(async (req, res) => {
  const userId = req.userId;
  const { fullname } = req.validated;
  const avatar = req.file?.path;

  const user = await User.findById(userId).select("+avatarId");

  if (!user) {
    if (avatar) {
      await safeUnlink(avatar);
    }
    throw new ApiError(404, "User not found");
  }

  let previousId = user.avatarId;

  let media = {
    public_id: user.avatarId,
    url: user.avatar,
  };

  if (avatar) {
    const { public_id, url } = await uploadFile(avatar);
    media.public_id = public_id;
    media.url = url;
  }

  user.fullname = fullname;
  user.avatar = media.url;
  user.avatarId = media.public_id;

  await user.save({ validateBeforeSave: false });

  if (avatar && previousId) {
    await deleteFile(previousId);
  }

  const userInfo = {
    fullname: user.fullname,
    avatar: user.avatar,
    email: user.email,
  };

  return new ApiResponse(
    200,
    "User information updated successfully",
    userInfo
  ).send(res);
});

export const refreshAccessToken = handleAsync(async (req, res) => {});

export const logoutUser = handleAsync(async (req, res) => {});

export const deleteUserAccount = handleAsync(async (req, res) => {});
