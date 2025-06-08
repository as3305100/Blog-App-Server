import fs from "node:fs/promises";

export const safeUnlink = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.warn("⚠️ Warning: Failed to delete file after upload in local server", err);
  }
};
