const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Not başlığı gereklidir"],
      trim: true,
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
        fileUrl: {
          type: String, // 👈 artık filePath yerine bu kullanılıyor
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        position: {
          type: Number,
          default: null,
        },
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

// 🔹 Index’ler (değişmedi)
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
