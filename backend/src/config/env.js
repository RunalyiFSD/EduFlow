require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'eduflow_dev_secret',

  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/eduflow',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',

  ADMIN_REGISTER_SECRET: process.env.ADMIN_REGISTER_SECRET || 'eduflow-admin-2024',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'dkgdlmvwu',

  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '583452312124562',

  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 'e-g6tT4w7u1Qn3G8L32V41sQ2W0',

  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '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',

  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'salunkherunalyi@gmail.com',

  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'AC32c576a85d5057683ed56dd8f416945f',

  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'aa12cbacb7fc5bf3302df24726199b6b',

  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '+16592469130',

  TWILIO_MESSAGING_SERVICE_SID: process.env.TWILIO_MESSAGING_SERVICE_SID || 'MG692ea06ca11675f3f74dbfd202b7e485'
};
