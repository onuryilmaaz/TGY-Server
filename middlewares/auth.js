const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");
const { errorResponse } = require("../utils/response");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return errorResponse(res, "Erişim token'ı bulunamadı", 401);
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return errorResponse(res, "Kullanıcı bulunamadı", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, "Geçersiz token", 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
