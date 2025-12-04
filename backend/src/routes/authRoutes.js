import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/Signup', authController.register);
router.post('/Login', authController.login);
router.post('/Logout', authController.logout);

export default router;
