import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import { env } from "../config/env";
import { ApiError } from "../common/ApiError";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeUploader(subfolder: string) {
  const dir = path.join(env.fileStorage.uploadDir, subfolder);
  ensureDir(dir);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuid()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: env.fileStorage.maxFileSizeMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`) as any);
      }
      cb(null, true);
    },
  });
}

// Sensitive documents (CON-013): stored under dedicated, non-public folders.
export const uploadPrescription = makeUploader("prescriptions");
export const uploadLicense = makeUploader("licenses");
