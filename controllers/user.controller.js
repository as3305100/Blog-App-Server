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

  const existedUser = await User.findOne({ email }).lean();

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

  const userObj = user.toObject();
  userObj.avatarId = undefined;
  userObj.password = undefined;

  return new ApiResponse(201, "User created successfully", userObj).send(res);
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
    accessToken,
    refreshToken,
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

  const user = await User.findById(userId).lean();

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

  if (avatar) {
    const { public_id, url } = await uploadFile(avatar);
    user.avatar = url;
    user.avatarId = public_id;
  }

  user.fullname = fullname;

  await user.save();

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

export const refreshAccessToken = handleAsync(async (req, res) => {
  const tokenFromHeader = req.headers?.authorization
    ?.trim()
    .startswith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : undefined;

  const refreshTokenClient = req.cookies?.refreshToken || tokenFromHeader;

  if (!refreshTokenClient) {
    throw new ApiError(
      400,
      "Refresh Token is not present. User needs to login again."
    );
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshTokenClient, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(400, "Invalid Refresh Token. Please login");
  }

  const user = await User.findById(decoded._id).select("+refreshToken").lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.refreshToken !== refreshTokenClient) {
    throw new ApiError(400, "Refresh token does not match");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user._id
  );

  user.refreshToken = refreshToken;

  await user.save({ validateBeforeSave: false });

  res
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 4 * 60 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

  return new ApiResponse(200, "Access token renewed successfully", {
    accessToken,
    refreshToken,
    _id: user._id,
  }).send(res);
});

export const logoutUser = handleAsync(async (req, res) => {
  const userId = req.userId;

  const user = await User.findById(userId).select("+refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.refreshToken = "";

  await user.save();

  res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions);

  return new ApiResponse(200, "User logout successful").send(res);
});

