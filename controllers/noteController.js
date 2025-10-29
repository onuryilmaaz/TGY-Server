const Note = require("../models/Note");
const Bookmark = require("../models/Bookmark");
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
      tags,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = { userId: req.user._id };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",");
      filter.tags = { $in: tagArray };
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
      userId: req.user._id,
    }).select("-__v");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Not bulunamadı.",
      });
    }

    note.images.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

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
  console.log("createNote çalıştı");
  try {
    const {
      title,
      content,
      images = [],
      tags = [],
      isPublic = false,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Başlık ve içerik gereklidir.",
      });
    }

    if (tags.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maksimum 5 tag eklenebilir.",
      });
    }

    // Görselleri konuma göre sırala
    const sortedImages = Array.isArray(images)
      ? images.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      : [];

    const note = new Note({
      title,
      content,
      images: sortedImages,
      tags,
      isPublic,
      userId: req.user._id,
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
    const { title, content, images, tags, isPublic } = req.body;

    if (tags && tags.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maksimum 5 tag eklenebilir.",
      });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (images !== undefined) {
      updateData.images = images.sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      );
    }
    if (tags !== undefined) updateData.tags = tags;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
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
      userId: req.user._id,
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
      userId: req.user._id,
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

// @desc    Public notları listele
// @route   GET /api/notes/public
// @access  Public
const getPublicNotes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      tags,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = { isPublic: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",");
      filter.tags = { $in: tagArray };
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    const notes = await Note.find(filter)
      .populate("userId", "firstName lastName")
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
    console.error("Public notları getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Public notlar getirilirken bir hata oluştu.",
      error: error.message,
    });
  }
};

// @desc    Public notu bookmark olarak toggle et (ekle/çıkar)
// @route   POST /api/notes/public/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      isPublic: true,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Public not bulunamadı.",
      });
    }

    // Mevcut bookmark'ı kontrol et
    const existingBookmark = await Bookmark.findOne({
      userId: req.user._id,
      noteId: req.params.id,
    });

    if (existingBookmark) {
      // Bookmark varsa sil
      await Bookmark.findByIdAndDelete(existingBookmark._id);

      res.status(200).json({
        success: true,
        message: "Not bookmark'tan çıkarıldı.",
        data: {
          isBookmarked: false,
          noteId: note._id,
          noteTitle: note.title,
        },
      });
    } else {
      // Bookmark yoksa ekle
      const bookmark = new Bookmark({
        userId: req.user._id,
        noteId: req.params.id,
      });

      await bookmark.save();

      res.status(201).json({
        success: true,
        message: "Not bookmark'a eklendi.",
        data: {
          isBookmarked: true,
          bookmarkId: bookmark._id,
          noteId: note._id,
          noteTitle: note.title,
          bookmarkedAt: bookmark.bookmarkedAt,
        },
      });
    }
  } catch (error) {
    console.error("Bookmark toggle hatası:", error);
    res.status(500).json({
      success: false,
      message: "Bookmark işlemi sırasında bir hata oluştu.",
      error: error.message,
    });
  }
};

// @desc    Bookmark'ları listele
// @route   GET /api/bookmarks
// @access  Private
const getBookmarks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      tags,
      sortBy = "bookmarkedAt",
      sortOrder = "desc",
    } = req.query;

    const filter = { userId: req.user._id };

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    let query = Bookmark.find(filter)
      .populate({
        path: "noteId",
        match: { isPublic: true },
        select: "title content tags images createdAt",
        populate: {
          path: "userId",
          select: "firstName lastName",
        },
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Eğer search veya tags varsa, note'lara göre filtrele
    if (search || tags) {
      const noteFilter = { isPublic: true };

      if (search) {
        noteFilter.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ];
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(",");
        noteFilter.tags = { $in: tagArray };
      }

      query = Bookmark.find(filter)
        .populate({
          path: "noteId",
          match: noteFilter,
          select: "title content tags images createdAt",
          populate: {
            path: "userId",
            select: "firstName lastName",
          },
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));
    }

    const bookmarks = await query;

    // Null note'ları filtrele (silinmiş public notlar)
    const validBookmarks = bookmarks.filter((bookmark) => bookmark.noteId);

    const total = await Bookmark.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        bookmarks: validBookmarks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBookmarks: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Bookmark'ları getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Bookmark'lar getirilirken bir hata oluştu.",
      error: error.message,
    });
  }
};

// @desc    Tüm tagları listele
// @route   GET /api/notes/tags
// @access  Private
const getAllTags = async (req, res) => {
  try {
    const tags = await Note.distinct("tags", { userId: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        tags: tags.filter((tag) => tag && tag.trim() !== ""),
      },
    });
  } catch (error) {
    console.error("Tagları getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Taglar getirilirken bir hata oluştu.",
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
  getPublicNotes,
  toggleBookmark,
  getBookmarks,
  getAllTags,
};
