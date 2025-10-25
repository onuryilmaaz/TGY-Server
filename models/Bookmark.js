const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
    },
    bookmarkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Aynı kullanıcı aynı notu birden fazla kez bookmark edemez
bookmarkSchema.index({ userId: 1, noteId: 1 }, { unique: true });

// Performans için index'ler
bookmarkSchema.index({ userId: 1, bookmarkedAt: -1 });

bookmarkSchema.virtual("url").get(function () {
  return `/api/bookmarks/${this._id}`;
});

bookmarkSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
