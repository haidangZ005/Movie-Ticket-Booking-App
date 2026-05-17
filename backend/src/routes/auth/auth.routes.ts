import { Router } from 'express';
import { AuthController } from '../../controllers/auth/auth.controller';
import { authValidator } from '../../validators/auth.validator';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// Định tuyến API Đăng ký yêu cầu cấp OTP
router.post('/register', authValidator.validateRegister, AuthController.register);

// Định tuyến API Xác nhận OTP để tạo tài khoản thật sự
router.post('/verify-otp', authValidator.validateVerifyOtp, AuthController.verifyOtp);

// Định tuyến API Đăng nhập tài khoản (cơ bản)
router.post('/login', authValidator.validateLogin, AuthController.login);

// Định tuyến API Refresh Token
router.post('/refresh-token', authValidator.validateRefreshToken, AuthController.refreshToken);

// Định tuyến API Logout (Yêu cầu phải có Access Token)
router.post('/logout', authMiddleware, authValidator.validateLogout, AuthController.logout);

// Định tuyến API Quên mật khẩu
router.post('/forgot-password', authValidator.validateForgotPassword, AuthController.forgotPassword);

// Định tuyến API Xác thực mã OTP đặt lại mật khẩu
router.post('/verify-reset-otp', authValidator.validateVerifyResetOtp, AuthController.verifyResetOtp);

// Định tuyến API Đặt lại mật khẩu
router.post('/reset-password', authValidator.validateResetPassword, AuthController.resetPassword);

// Định tuyến API Đổi mật khẩu (Yêu cầu phải có Access Token)
router.post('/change-password', authMiddleware, authValidator.validateChangePassword, AuthController.changePassword);

export default router;
