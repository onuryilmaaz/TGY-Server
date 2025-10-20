const Note = require("../models/Note");
const fs = require("fs");
const path = require("path");

// @desc    Tüm notları listele (kullanıcıya göre)
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = { userId: "temp-user-id" };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    const notes = await Note.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    const total = await Note.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        notes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalNotes: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Notları getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Notlar getirilirken bir hata oluştu.",
      error: error.message,
    });
  }
};

// @desc    Tek not getir (ID'ye göre)
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: "temp-user-id",
    }).select("-__v");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Not bulunamadı.",
      });
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Not getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Not getirilirken bir hata oluştu.",
      error: error.message,
    });
  }
};

// @desc    Yeni not oluştur
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  try {
    const { title, content, images } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Başlık ve içerik gereklidir.",
      });
    }

    const note = new Note({
      title,
      content,
      images: images || [],
      userId: "temp-user-id",
    });

    const savedNote = await note.save();

    res.status(201).json({
      success: true,
      message: "Not başarıyla oluşturuldu.",
      data: savedNote,
    });
  } catch (error) {
    console.error("Not oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Not oluşturulurken bir hata oluştu.",
      error: error.message,
    });
  }
};

// @desc    Not güncelle
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
  try {
    const { title, content, images } = req.body;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: "temp-user-id" },
      {
        ...(title && { title }),
        ...(content && { content }),
        ...(images && { images }),
      },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Not bulunamadı.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Not başarıyla güncellendi.",
      data: note,
    });
  } catch (error) {
    console.error("Not güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Not güncellenirken bir hata oluştu.",
      error: error.message,
    });
  }
};

// @desc    Not sil
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: "temp-user-id",
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Not bulunamadı.",
      });
    }

    if (note.images && note.images.length > 0) {
      note.images.forEach((image) => {
        const filePath = path.join(
          process.cwd(),
          "uploads",
          "images",
          image.fileName
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Not başarıyla silindi.",
    });
  } catch (error) {
    console.error("Not silme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Not silinirken bir hata oluştu.",
      error: error.message,
    });
  }
};

// @desc    Not resmini getir
// @route   GET /api/notes/:id/image/:fileName
// @access  Private
const getNoteImage = async (req, res) => {
  try {
    const { id, fileName } = req.params;

    // Not'un varlığını ve kullanıcıya ait olduğunu kontrol et
    const note = await Note.findOne({
      _id: id,
      userId: "temp-user-id",
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Not bulunamadı.",
      });
    }

    // Resmin nota ait olduğunu kontrol et
    const imageExists = note.images.some((img) => img.fileName === fileName);
    if (!imageExists) {
      return res.status(404).json({
        success: false,
        message: "Resim bu nota ait değil.",
      });
    }

    // Dosya yolunu oluştur
    const filePath = path.join(process.cwd(), "uploads", "images", fileName);

    // Dosyanın varlığını kontrol et
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Resim dosyası bulunamadı.",
      });
    }

    // Dosya tipini belirle
    const ext = path.extname(fileName).toLowerCase();
    let contentType = "image/jpeg";

    switch (ext) {
      case ".png":
        contentType = "image/png";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
      case ".jpg":
      case ".jpeg":
      default:
        contentType = "image/jpeg";
        break;
    }

    // Resmi gönder
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 yıl cache
    res.sendFile(filePath);
  } catch (error) {
    console.error("Resim getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Resim getirilirken bir hata oluştu.",
      error: error.message,
    });
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getNoteImage,
};
