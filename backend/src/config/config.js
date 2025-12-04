import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI ,
  jwtSecret: process.env.JWT_SECRET ,
};
