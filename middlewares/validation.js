const { body, validationResult } = require("express-validator");
const { errorResponse } = require("../utils/response");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    return errorResponse(res, "Validasyon hatası", 400, errorMessages);
  }
  next();
};

const validateRegister = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("Ad alanı zorunludur")
    .isLength({ min: 2, max: 50 })
    .withMessage("Ad 2-50 karakter arasında olmalıdır"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Soyad alanı zorunludur")
    .isLength({ min: 2, max: 50 })
    .withMessage("Soyad 2-50 karakter arasında olmalıdır"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email alanı zorunludur")
    .isEmail()
    .withMessage("Geçerli bir email adresi giriniz")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Şifre alanı zorunludur")
    .isLength({ min: 6 })
    .withMessage("Şifre en az 6 karakter olmalıdır"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Şifre tekrar alanı zorunludur")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Şifreler eşleşmiyor");
      }
      return true;
    }),

  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email alanı zorunludur")
    .isEmail()
    .withMessage("Geçerli bir email adresi giriniz")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Şifre alanı zorunludur"),

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  handleValidationErrors,
};
