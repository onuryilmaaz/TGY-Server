const jwt = require("jsonwebtoken");
const config = require("../config");

const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRE = config.jwt.expiresIn;

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Geçersiz token");
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error("Token decode edilemedi");
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
