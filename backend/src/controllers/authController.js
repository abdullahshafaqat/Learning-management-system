import * as authService from '../services/authService.js';
import { setTokenCookie, clearTokenCookie } from '../utils/token.js';

export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const { token, user } = await authService.register(username, email, password, role);
    
    setTokenCookie(res, token);
    
    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login(email, password);
    
    setTokenCookie(res, token);
    
    res.json({ 
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    clearTokenCookie(res);
    
    res.json({ 
      success: true,
      message: 'Logout successful'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
