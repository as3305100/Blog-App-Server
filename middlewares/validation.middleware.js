import Joi from "joi";
import { userValidationField } from "../utils/userValidationField.js";
import { blogValidationField } from "../utils/blogValidationField.js";
import { validate } from "../utils/validateSchema.js";

const signupSchema = Joi.object({
  fullname: userValidationField.fullname,
  email: userValidationField.email,
  password: userValidationField.password,
});

const loginSchema = Joi.object({
  email: userValidationField.email,
  password: userValidationField.password,
});

const blogSchema = Joi.object({
  title: blogValidationField.title,
  slug: blogValidationField.slug,
  content: blogValidationField.content,
  status: blogValidationField.status,
});

export const signupValidation = validate(signupSchema);
export const loginValidation = validate(loginSchema);
export const blogValidtion = validate(blogSchema);
