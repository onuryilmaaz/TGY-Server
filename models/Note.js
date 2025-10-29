const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
    images: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        mimeType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
        position: { type: Number, default: null },
        width: { type: Number, default: null },
        height: { type: Number, default: null },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: {
      type: [String],
      validate: {
        validator: function (tags) {
          return tags.length <= 5;
        },
        message: "Maksimum 5 tag eklenebilir",
      },
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 🔹 En az bir alan zorunlu kontrolü
noteSchema.pre("validate", function (next) {
  if (
    (!this.title || this.title.trim() === "") &&
    (!this.content || this.content.trim() === "") &&
    (!this.images || this.images.length === 0)
  ) {
    this.invalidate(
      "content",
      "En az bir alan (başlık, içerik veya görsel) doldurulmalıdır."
    );
  }
  next();
});

// 🔹 Index’ler
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, title: "text", content: "text" });
noteSchema.index({ isPublic: 1, createdAt: -1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ userId: 1, tags: 1 });

// 🔹 Virtual alan
noteSchema.virtual("url").get(function () {
  return `/api/notes/${this._id}`;
});

noteSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Note", noteSchema);
