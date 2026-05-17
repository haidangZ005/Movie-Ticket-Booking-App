import { Response } from 'express';
import { CustomerService } from '../../services/customer.service';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class CustomerController {
  /**
   * Xử lý luồng lấy thông tin Profile cơ bản:
   * Trích xuất accountId từ JWT Token (đã được parse và gán sẵn trong req.user qua authMiddleware),
   * Móc logic từ Service và định dạng đầu ra chuẩn.
   */
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // req.user được đảm bảo chắc chắn tồn tại thông qua authMiddleware
    const accountId = req.user!.accountId;
    
    // Gọi layer Service xử lý và truy vấn DB
    const result = await CustomerService.getProfile(accountId);

    // Bọc kết quả về định dạng quy chuẩn của dự án:
    // Theo Repo Style, ResponseCode.SUCCESS có code: 1000
    const responseBody = ApiResponse.success(ResponseCode.SUCCESS, result);
    
    res.status(200).json(responseBody);
  });

  /**
   * Xử lý luồng cập nhật thông tin Profile:
   * Lấy mã định danh từ JWT, nhận dữ liệu chắp vá (Partial) từ req.body, đẩy sang service
   * và format trả về cho Client.
   */
  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user!.accountId;
    
    // Rút trích cụ thể các field mà hệ thống cho phép user tự ý sửa chữa
    // Hỗ trợ cả PascalCase (từ mobile) và camelCase (chuẩn API)
    const FullName = req.body.FullName || req.body.fullName;
    const PhoneNumber = req.body.PhoneNumber || req.body.phoneNumber;
    const Gender = req.body.Gender || req.body.gender;
    const DateOfBirth = req.body.DateOfBirth || req.body.dateOfBirth;
    const AvatarUrl = req.body.AvatarUrl || req.body.avatarUrl;
    
    const payload = {
      FullName,
      PhoneNumber,
      Gender,
      DateOfBirth,
      AvatarUrl
    };

    const result = await CustomerService.updateProfile(accountId, payload);

    const responseBody = ApiResponse.success(ResponseCode.SUCCESS, result);
    
    res.status(200).json(responseBody);
  });
}
