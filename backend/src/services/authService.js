import User from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../utils/token.js';

export const register = async (username, email, password, role = 'student') => {
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(password);
  const user = new User({
    username,
    email,
    password: hashedPassword,
    role,
  });

  await user.save();
  return { token: generateToken(user._id, user.role), user };
};

export const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return { token: generateToken(user._id, user.role), user };
};
