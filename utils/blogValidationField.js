import Joi from "joi";

export const blogValidationField = {
  title: Joi.string().trim().min(3).max(60).required().messages({
    "any.required": "Title is required",
    "string.empty": "Title is required",
    "string.min": "Title length not less than 3 characters",
    "string.max": "Title length must not exceed 60 characters",
  }),

  slug: Joi.string().trim().min(3).max(70).required().messages({
    "any.required": "Slug value is required",
    "string.empty": "Slug value is required",
    "string.min": "Slug length not less than 3 characters",
    "string.max": "Slug length must not exceed 70 characters",
  }),

  content: Joi.string().trim().min(3).max(8000).required().messages({
    "any.required": "Content is required",
    "string.empty": "Content is required",
    "string.min": "Content length not less than 3 characters",
    "string.max": "Content length must not exceed 8000 characters",
  }),

  status: Joi.string()
    .valid("active", "inactive")
    .default("inactive")
    .messages({
      "any.only": "Please select a valid status",
    }),
};
