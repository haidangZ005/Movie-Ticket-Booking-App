export interface EmailJobData {
  email: string;
  otp: string;
  type: 'REGISTER_OTP' | 'RESET_PASSWORD_OTP';
}
