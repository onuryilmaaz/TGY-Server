const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const {
  createTextSummarizePrompt,
  createImageAnalysisPrompt,
} = require("../utils/prompts");
const AnalyzedImage = require("../models/AnalyzedImage");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Verilen metni özetler
// @route   POST /api/ai/summarize-text
// @access  Private
const summarizeText = async (req, res) => {
  try {
    const { text, summaryLength = "orta" } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Geçerli bir metin gönderilmedi.",
      });
    }

    if (text.length < 50) {
      return res.status(400).json({
        success: false,
        message: "Metin çok kısa. En az 50 karakter olmalı.",
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        message: "Metin çok uzun. Maksimum 10.000 karakter olmalı.",
      });
    }

    const validLengths = ["kısa", "orta", "uzun"];
    if (!validLengths.includes(summaryLength)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz özet uzunluğu. 'kısa', 'orta' veya 'uzun' olmalı.",
      });
    }

    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: "AI servisi mevcut değil.",
      });
    }

    const prompt = createTextSummarizePrompt(text, summaryLength);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    const cleanedText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse hatası:", parseError);
      return res.status(500).json({
        success: false,
        message: "AI yanıtı işlenirken hata oluştu.",
      });
    }

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Metin özetleme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Metin özetlenirken bir hata meydana geldi.",
      error: error.message,
    });
  }
};

// @desc    Görsel analizi yapar
// @route   POST /api/ai/analyze-image
// @access  Private
const analyzeImage = async (req, res) => {
  try {
    const { userText = "Bu görseli analiz et" } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Görsel dosyası gönderilmedi.",
      });
    }

    const supportedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!supportedMimeTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message:
          "Desteklenmeyen dosya formatı. JPEG, PNG, WebP veya GIF kullanın.",
      });
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Dosya boyutu çok büyük. Maksimum 5MB olmalı.",
      });
    }

    if (
      !userText ||
      typeof userText !== "string" ||
      userText.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Geçerli bir metin/soru gönderilmedi.",
      });
    }

    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: "AI servisi mevcut değil.",
      });
    }

    // Kaydetmeden direkt AI'ya gönder
    const prompt = createImageAnalysisPrompt(userText);

    const imageData = {
      inlineData: {
        data: imageFile.buffer.toString("base64"),
        mimeType: imageFile.mimetype,
      },
    };

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const rawText = response.text();

    const cleanedText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .replace(/\n\s*\n/g, "\n")
      .replace(/\s+/g, " ")
      .trim();

    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch {
      data = { rawText: cleanedText }; // JSON değilse düz metin olarak dön
    }

    // Sadece analiz sonucunu döndür
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Görsel analizi hatası:", error);
    res.status(500).json({
      success: false,
      message: "Görsel analizi yapılırken bir hata meydana geldi.",
      error: error.message,
    });
  }
};

// @desc    Resim yükler ve dosya sistemine kaydeder
// @route   POST /api/ai/upload-image
// @access  Private
const uploadImage = async (req, res) => {
  try {
    const imageFile = req.file;
    const { position } = req.body; // Swift tarafında textView içindeki index konumu

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Görsel dosyası gönderilmedi.",
      });
    }

    const supportedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!supportedMimeTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message:
          "Desteklenmeyen dosya formatı. JPEG, PNG, WebP veya GIF kullanın.",
      });
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Dosya boyutu çok büyük. Maksimum 5MB olmalı.",
      });
    }

    const timestamp = Date.now();
    const fileExtension = path.extname(imageFile.originalname);
    const fileName = `image_${timestamp}${fileExtension}`;
    const uploadDir = path.join("uploads", "images");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, imageFile.buffer);

    const fileUrl = `/uploads/images/${fileName}`;

    res.status(200).json({
      success: true,
      data: {
        fileName,
        fileUrl,
        mimeType: imageFile.mimetype,
        fileSize: imageFile.size,
        position: position ? Number(position) : null,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Resim yükleme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Resim yüklenirken bir hata meydana geldi.",
      error: error.message,
    });
  }
};

// @desc    Analiz geçmişini getir
// @route   GET /api/ai/analysis-history
// @access  Private
const getAnalysisHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const analyses = await AnalyzedImage.find({ userId: req.user._id })
      .sort({ analyzedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    const total = await AnalyzedImage.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        analyses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalAnalyses: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Analiz geçmişi getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Analiz geçmişi getirilirken bir hata oluştu.",
      error: error.message,
    });
  }
};

module.exports = {
  summarizeText,
  analyzeImage,
  uploadImage,
  getAnalysisHistory,
};
