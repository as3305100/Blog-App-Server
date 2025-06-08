import Joi from "joi";
import { userValidationField } from "../utils/userValidationField.js";
import { blogValidationField } from "../utils/blogValidationField.js";
import { validate } from "../utils/validateSchema.js";

const signupSchema = Joi.object({
  fullname: userValidationField.fullname,
  email: userValidationField.email,
  password: userValidationField.password,
  avatar: Joi.any().optional(),
});

const loginSchema = Joi.object({
  email: userValidationField.email,
  password: userValidationField.password,
});

const updateSchema = Joi.object({
  fullname: userValidationField.fullname,
  avatar: Joi.any().optional(),
});

const blogSchema = Joi.object({
  title: blogValidationField.title,
  slug: blogValidationField.slug,
  content: blogValidationField.content,
  status: blogValidationField.status,
  image: Joi.any().optional(),
});

export const signupValidation = validate(signupSchema);
export const loginValidation = validate(loginSchema);
export const updateValidation = validate(updateSchema);
export const blogValidtion = validate(blogSchema);
