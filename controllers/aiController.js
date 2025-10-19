const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const {
  createTextSummarizePrompt,
  createImageAnalysisPrompt,
} = require("../utils/prompts");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Verilen metni özetler
// @route   POST /api/ai/summarize-text
// @access  Public
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
// @access  Public
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

    data.imageInfo = {
      fileName: imageFile.originalname,
      fileSize: imageFile.size,
      mimeType: imageFile.mimetype,
    };

    res.status(200).json({
      success: true,
      data: data,
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
// @access  Public
const uploadImage = async (req, res) => {
  try {
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

    const timestamp = Date.now();
    const fileExtension = path.extname(imageFile.originalname);
    const fileName = `image_${timestamp}${fileExtension}`;
    const filePath = path.join("uploads", "images", fileName);

    fs.writeFileSync(filePath, imageFile.buffer);

    const fileUrl = `/uploads/images/${fileName}`;

    res.status(200).json({
      success: true,
      data: {
        fileName: fileName,
        originalName: imageFile.originalname,
        filePath: fileUrl,
        fileSize: imageFile.size,
        mimeType: imageFile.mimetype,
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

module.exports = {
  summarizeText,
  analyzeImage,
  uploadImage,
};
