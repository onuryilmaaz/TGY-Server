const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/noteController");
const { authenticateToken } = require("../middlewares/auth");

// Public notları listele - authentication gerekmez
router.get("/public", getPublicNotes);

// Diğer tüm not işlemleri için authentication gerekli
router.use(authenticateToken);

// @desc    Tüm tagları listele
// @route   GET /api/notes/tags
// @access  Private
router.get("/tags", getAllTags);

// @desc    Bookmark'ları listele
// @route   GET /api/bookmarks
// @access  Private
router.get("/bookmarks", getBookmarks);

// @desc    Tüm notları listele
// @route   GET /api/notes
// @access  Private
router.get("/", getNotes);

// @desc    Tek not getir (ID'ye göre)
// @route   GET /api/notes/:id
// @access  Private
router.get("/:id", getNoteById);

// @desc    Yeni not oluştur
// @route   POST /api/notes
// @access  Private
router.post("/", createNote);

// @desc    Not güncelle
// @route   PUT /api/notes/:id
// @access  Private
router.put("/:id", updateNote);

// @desc    Not sil
// @route   DELETE /api/notes/:id
// @access  Private
router.delete("/:id", deleteNote);

// @desc    Not resmini getir
// @route   GET /api/notes/:id/image/:fileName
// @access  Private
router.get("/:id/image/:fileName", getNoteImage);

// @desc    Public notu bookmark olarak toggle et (ekle/çıkar)
// @route   POST /api/notes/public/:id/bookmark
// @access  Private
router.post("/public/:id/bookmark", toggleBookmark);

module.exports = router;
