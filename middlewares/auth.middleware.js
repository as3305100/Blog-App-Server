import jwt from "jsonwebtoken";
import { ApiError, handleAsync } from "./error.middleware.js";

export const isAuthenticated = handleAsync(async (req, res, next) => {
  const tokenFromHeader = req.headers?.authorization
    ?.trim()
    .startswith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : undefined;

  const token = req.cookies.accessToken || tokenFromHeader;

  if (!token) {
    throw new ApiError(401, "Token is not present. User has to login");
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }

  req.userId = decoded._id;

  next();
});
