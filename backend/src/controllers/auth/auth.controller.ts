import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AuthService } from '../../services/auth.service';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';

export class AuthController {
  /**
   * Xử lý luồng đăng ký cơ bản:
   * Trích xuất req.body, gọi Service và chuẩn hóa kết quả đầu ra bằng ApiResponse.
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    // Gửi OTP qua email thay vì tạo ngay
    const result = await AuthService.registerWithOtp(email, password);

    const responseBody = ApiResponse.success(ResponseCode.OTP_SENT, result);
    
    res.status(200).json(responseBody);
  });

  /**
   * Xử lý luồng xác thực OTP:
   * Trích xuất email & otp, gọi Service để đối chiếu Cache và ghi DB.
   */
  static verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    
    const result = await AuthService.verifyOtp(email, otp);

    const responseBody = ApiResponse.success(ResponseCode.USER_CREATED, result);
    
    res.status(201).json(responseBody);
  });

  /**
   * Xử lý luồng đăng nhập cơ bản:
   * Trích xuất req.body, gọi Service và trả về Access Token.
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await AuthService.loginBasic(email, password);

    const responseBody = ApiResponse.success(ResponseCode.LOGIN_SUCCESS, result);

    res.status(200).json(responseBody);
  });

  /**
   * Xử lý luồng refresh token
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await AuthService.refreshToken(refreshToken);

    const responseBody = ApiResponse.success(ResponseCode.SUCCESS, result);

    res.status(200).json(responseBody);
  });

  /**
   * Xử lý luồng logout
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader!.split(' ')[1]; // Đã được authMiddleware đảm bảo tồn tại
    const { refreshToken } = req.body;

    const result = await AuthService.logout(accessToken, refreshToken);

    const responseBody = ApiResponse.success(ResponseCode.SUCCESS, result);

    res.status(200).json(responseBody);
  });

  /**
   * Xử lý luồng quên mật khẩu
   */
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    await AuthService.forgotPassword(email);

    // Luôn trả về thành công để tránh lộ lọt email
    const responseBody = ApiResponse.success(ResponseCode.OTP_SENT, { success: true });

    res.status(200).json(responseBody);
  });

  /**
   * Xử lý luồng xác thực mã OTP đặt lại mật khẩu
   */
  static verifyResetOtp = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    await AuthService.verifyResetOtp(email, otp);

    const responseBody = ApiResponse.success(ResponseCode.SUCCESS, { success: true });

    res.status(200).json(responseBody);
  });

  /**
   * Xử lý luồng đặt lại mật khẩu bằng OTP
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, newPassword } = req.body;

    await AuthService.resetPassword(email, newPassword);

    const responseBody = ApiResponse.success(ResponseCode.PASSWORD_RESET_SUCCESS, { success: true });

    res.status(200).json(responseBody);
  });

  /**
   * Xử lý luồng đổi mật khẩu (đã đăng nhập)
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user!.accountId;
    const { oldPassword, newPassword, refreshToken } = req.body;
    
    const authHeader = req.headers.authorization;
    const accessToken = authHeader!.split(' ')[1];

    await AuthService.changePassword(accountId, oldPassword, newPassword, accessToken, refreshToken);

    const responseBody = ApiResponse.success(ResponseCode.PASSWORD_CHANGED_SUCCESS, { success: true });

    res.status(200).json(responseBody);
  });
}
