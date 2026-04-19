import fs from "fs/promises";
import path from "path";

const uploadsRoot = path.resolve(process.cwd(), "uploads");

export async function deleteUploadedFile(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) {
    return;
  }

  const filename = fileUrl.replace("/uploads/", "");
  const target = path.resolve(uploadsRoot, filename);

  if (!target.startsWith(uploadsRoot)) {
    return;
  }

  try {
    await fs.unlink(target);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Failed to delete upload", target, err);
    }
  }
}
