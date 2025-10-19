module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/tgy-server",
    options: {},
  },

  jwt: {
    secret: process.env.JWT_SECRET || "fallback-secret-key",
    expiresIn: process.env.JWT_EXPIRE || "7d",
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },
};
