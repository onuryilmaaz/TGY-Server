const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const config = require("./config");

const app = express();

app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log("MongoDB bağlantısı başarılı");
  } catch (error) {
    console.error("MongoDB bağlantı hatası:", error);
    process.exit(1);
  }
};

app.use("/api/auth", require("./routes/authRoutes.js"));
app.use("/api/ai", require("./routes/aiRoutes.js"));
app.use("/api/notes", require("./routes/noteRoutes.js"));

app.get("/", (req, res) => {
  res.json({
    message: "Not Uygulaması Backend API",
    version: "1.0.0",
    description: "Authentication ve AI destekli not uygulaması backend servisi",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile",
        updateProfile: "PUT /api/auth/profile",
      },
      ai: {
        summarizeText: "POST /api/ai/summarize-text - Metinleri özetler",
        analyzeImage: "POST /api/ai/analyze-image - Görselleri analiz eder",
        uploadImage: "POST /api/ai/upload-image - Resimleri yükler ve saklar",
      },
      notes: {
        getAllNotes: "GET /api/notes - Tüm notları listele",
        getNoteById: "GET /api/notes/:id - Tek not getir",
        createNote: "POST /api/notes - Yeni not oluştur",
        updateNote: "PUT /api/notes/:id - Not güncelle",
        deleteNote: "DELETE /api/notes/:id - Not sil",
        getNoteImage:
          "GET /api/notes/:id/image/:fileName - Not resmini güvenli şekilde getir",
      },
    },
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint bulunamadı",
  });
});

app.use((error, req, res, next) => {
  console.error("Global error:", error);
  res.status(500).json({
    success: false,
    message: "Sunucu hatası",
  });
});

const PORT = config.port;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
    console.log(`API URL: http://localhost:${PORT}`);
  });
};

startServer().catch(console.error);
