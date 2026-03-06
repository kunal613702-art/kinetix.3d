import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import authMiddleware from "../middleware/authMiddleware.js";
import UploadModel from "../models/UploadModel.js";
import User from "../models/User.js";

const router = express.Router();

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`)
});

const upload = multer({ storage });

router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File is required" });

  const user = await User.findById(req.user.id).select("name");
  const modelName = req.body.modelName || path.parse(req.file.originalname).name;
  const material = req.body.material || "PLA";

  const created = await UploadModel.create({
    user: req.user.id,
    modelName,
    fileName: req.file.filename,
    fileSize: req.file.size,
    material,
    uploadedBy: user?.name || "User"
  });

  res.status(201).json({
    ...created.toObject(),
    downloadUrl: `/uploads/${created.fileName}`
  });
});

router.get("/my", authMiddleware, async (req, res) => {
  const uploads = await UploadModel.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(
    uploads.map((item) => ({
      ...item.toObject(),
      downloadUrl: `/uploads/${item.fileName}`
    }))
  );
});

router.get("/:id/download", authMiddleware, async (req, res) => {
  const item = await UploadModel.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Upload not found" });
  const fullPath = path.resolve(uploadDir, item.fileName);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ message: "File not found" });
  res.download(fullPath);
});

export default router;
