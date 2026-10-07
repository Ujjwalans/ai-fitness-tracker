import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import protect from "../middleware/protect.js";
import { analyzeStylePhoto } from "../controllers/styleAdvisorController.js";

const router = express.Router();

const uploadDir = path.join("/tmp", "uploads", "style");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName = `style-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only JPG, PNG and WebP images are allowed.")
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/analyze",
  protect,
  upload.single("photo"),
  analyzeStylePhoto
);

export default router;