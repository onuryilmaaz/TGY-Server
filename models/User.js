const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Ad alanı zorunludur"],
      trim: true,
      minlength: [2, "Ad en az 2 karakter olmalıdır"],
      maxlength: [50, "Ad en fazla 50 karakter olabilir"],
    },
    lastName: {
      type: String,
      required: [true, "Soyad alanı zorunludur"],
      trim: true,
      minlength: [2, "Soyad en az 2 karakter olmalıdır"],
      maxlength: [50, "Soyad en fazla 50 karakter olabilir"],
    },
    email: {
      type: String,
      required: [true, "Email alanı zorunludur"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Geçerli bir email adresi giriniz",
      ],
    },
    password: {
      type: String,
      required: [true, "Şifre alanı zorunludur"],
      minlength: [6, "Şifre en az 6 karakter olmalıdır"],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);
