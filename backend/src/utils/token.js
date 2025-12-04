import jwt from 'jsonwebtoken';
import config from '../config/config.js';


export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, config.jwtSecret, {
    expiresIn: '1d',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

export const setTokenCookie = (res, token) => {
  res.cookie('token', token, cookieOptions);
};

export const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
};
