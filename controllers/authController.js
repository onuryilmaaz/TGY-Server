const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const Note = require("../models/Note");
const Bookmark = require("../models/Bookmark");
const fs = require("fs");
const path = require("path");
const {
  successResponse,
  errorResponse,
  serverErrorResponse,
} = require("../utils/response");

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, "Bu email adresi zaten kayıtlı", 400);
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
    });

    await user.save();

    const token = generateToken({
      userId: user._id,
      email: user.email,
    });

    const userResponse = user.toJSON();

    return successResponse(
      res,
      "Kullanıcı başarıyla kaydedildi",
      {
        user: userResponse,
        token,
      },
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    return serverErrorResponse(res, "Kayıt işlemi sırasında bir hata oluştu");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, "Email veya şifre hatalı", 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(res, "Email veya şifre hatalı", 401);
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
    });

    const userResponse = user.toJSON();

    return successResponse(res, "Giriş başarılı", {
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return serverErrorResponse(res, "Giriş işlemi sırasında bir hata oluştu");
  }
};

const getProfile = async (req, res) => {
  try {
    const user = req.user;
    return successResponse(res, "Profil bilgileri getirildi", { user });
  } catch (error) {
    console.error("Get profile error:", error);
    return serverErrorResponse(res, "Profil bilgileri getirilemedi");
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user._id;

    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return errorResponse(res, "Bu email adresi zaten kullanılıyor", 400);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName || req.user.firstName,
        lastName: lastName || req.user.lastName,
        email: email || req.user.email,
      },
      { new: true, runValidators: true }
    );

    return successResponse(res, "Profil başarıyla güncellendi", {
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return serverErrorResponse(res, "Profil güncellenirken bir hata oluştu");
  }
};

// Kullanıcı hesabını ve ona ait notları sil
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Kullanıcının notlarındaki görselleri dosya sisteminden kaldır
    const userNotes = await Note.find({ userId });
    userNotes.forEach((note) => {
      if (note.images && note.images.length > 0) {
        note.images.forEach((image) => {
          const filePath = path.join(
            process.cwd(),
            "uploads",
            "images",
            image.fileName
          );
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (_) {}
          }
        });
      }
    });

    // Notları ve ilgili bookmark'ları sil
    await Note.deleteMany({ userId });
    await Bookmark.deleteMany({ userId });

    // Kullanıcıyı sil
    await User.findByIdAndDelete(userId);

    return successResponse(res, "Hesap ve notlar başarıyla silindi", null, 200);
  } catch (error) {
    console.error("Delete account error:", error);
    return serverErrorResponse(res, "Hesap silinirken bir hata oluştu");
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
};
