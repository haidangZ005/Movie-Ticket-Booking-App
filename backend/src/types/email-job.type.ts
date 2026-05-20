/**
 * Discriminated union cho từng loại email job.
 * Thêm type mới vào đây khi có email template mới (Buổi 5+).
 */
export type EmailJobData =
  | {
      type: 'REGISTER_OTP';
      email: string;
      otp: string;
    }
  | {
      type: 'RESET_PASSWORD_OTP';
      email: string;
      otp: string;
    }
  | {
      type: 'WELCOME';
      email: string;
      fullName: string;
    };

