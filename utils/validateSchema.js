import fs from "node:fs/promises";
import { ApiError } from "../middlewares/error.middleware.js";

export const validate = (schema) => {
  return async (req, res, next) => {
    const localFilePath = req?.file?.path;

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      if (localFilePath) {
        await fs.unlink(localFilePath).catch((err) => {
          console.warn(
            "⚠️ Warning: Failed to delete file after upload in local server",
            err
          );
        });
      }

      const messages = error.details.map((err) => err.message);
      throw new ApiError(400, "validation error", messages);
    }
    req.validated = value;
    next();
  };
};
