const express = require("express");
const router = express.Router();
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");
// const { authenticateToken } = require("../middlewares/auth");

// Şimdilik authentication kapalı - gerektiğinde açılacak
// router.use(authenticateToken);

// @desc    Tüm notları listele
// @route   GET /api/notes
// @access  Public (şimdilik)
router.get("/", getNotes);

// @desc    Tek not getir (ID'ye göre)
// @route   GET /api/notes/:id
// @access  Public (şimdilik)
router.get("/:id", getNoteById);

// @desc    Yeni not oluştur
// @route   POST /api/notes
// @access  Public (şimdilik)
router.post("/", createNote);

// @desc    Not güncelle
// @route   PUT /api/notes/:id
// @access  Public (şimdilik)
router.put("/:id", updateNote);

// @desc    Not sil
// @route   DELETE /api/notes/:id
// @access  Public (şimdilik)
router.delete("/:id", deleteNote);

module.exports = router;
