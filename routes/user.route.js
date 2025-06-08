import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { upload } from "../utils/multer.js";
import {
  loginValidation,
  signupValidation,
  updateValidation,
} from "../middlewares/validation.middleware.js";
import {
  createUser,
  getUserProfile,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/signup", upload.single("avatar"), signupValidation, createUser);
router.post("/login", loginValidation, loginUser);

router.get("/profile", isAuthenticated, getUserProfile);

router.patch(
  "/update-profile",
  isAuthenticated,
  upload.single("avatar"),
  updateValidation,
  updateUserProfile
);

router.post("/refresh-access", refreshAccessToken);

router.post("/logout", isAuthenticated, logoutUser);

export default router
