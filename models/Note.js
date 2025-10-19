const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Not başlığı gereklidir"],
      trim: true,
      maxlength: [200, "Başlık 200 karakterden uzun olamaz"],
    },
    content: {
      type: String,
      required: [true, "Not içeriği gereklidir"],
      trim: true,
    },
    images: [
      {
        fileName: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        filePath: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    userId: {
      type: String,
      default: "temp-user-id",
    },
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, title: "text", content: "text" });

noteSchema.virtual("url").get(function () {
  return `/api/notes/${this._id}`;
});

noteSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Note", noteSchema);
