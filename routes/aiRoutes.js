const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  summarizeText,
  analyzeImage,
  uploadImage,
  getAnalysisHistory,
} = require("../controllers/aiController");
const { authenticateToken } = require("../middlewares/auth");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const supportedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (supportedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Desteklenmeyen dosya formatı. JPEG, PNG, WebP veya GIF kullanın."
        ),
        false
      );
    }
  },
});

router.post("/summarize-text", authenticateToken, summarizeText);
router.post(
  "/analyze-image",
  authenticateToken,
  upload.single("image"),
  analyzeImage
);
router.post(
  "/upload-image",
  authenticateToken,
  upload.single("image"),
  uploadImage
);
router.get("/analysis-history", authenticateToken, getAnalysisHistory);
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Dosya boyutu çok büyük. Maksimum 5MB olmalı.",
      });
    }
  }

  if (error.message.includes("Desteklenmeyen dosya formatı")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
});

module.exports = router;
