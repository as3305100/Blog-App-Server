import Joi from "joi";

export const userValidationField = {
  email: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .required()
    .messages({
      "any.required": "Email is required",
      "string.pattern.base": "Please provide a valid email",
    }),
  fullname: Joi.string().trim().min(3).max(60).required().messages({
    "any.required": "Fullname is required",
    "string.min": "Fullname length should not less than 3 characters",
    "string.max": "Fullname length not more than 50 characters",
  }),
  password: Joi.string().trim().min(8).max(60).required().messages({
    "any.required": "Password is required",
    "string.min": "Password must be at least 8 characters",
    "string.max": "Password must not exceed 60 characters",
  }),
};
