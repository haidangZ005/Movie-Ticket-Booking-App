import { emailTransporter } from '../config/email';
import { EmailTemplates } from '../utils/helpers/email-templates.util';

const SENDER_ADDRESS = `"CineBook" <${process.env.SMTP_USER || 'no-reply@cinebook.vn'}>`;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export class EmailService {
  /**
   * Helper dùng chung: gửi email qua Nodemailer transporter.
   * - Ở môi trường dev/staging: nếu SMTP chưa cấu hình thì log ra console thay vì gửi thật.
   * - Ở production: bắt buộc phải có SMTP, throw nếu thiếu hoặc gửi thất bại.
   */
  private static async send(options: {
    to: string;
    subject: string;
    html: string;
    fallbackLog?: string;
  }): Promise<void> {
    const isSmtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);

    if (!isSmtpConfigured) {
      if (IS_PRODUCTION) {
        throw new Error('[EmailService] SMTP chưa được cấu hình trong môi trường production.');
      }
      if (options.fallbackLog) {
        console.log(`[EmailService - Dev] ${options.fallbackLog}`);
      }
      return;
    }

    try {
      await emailTransporter.sendMail({
        from: SENDER_ADDRESS,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (error: any) {
      if (!IS_PRODUCTION) {
        console.warn(`[EmailService - Dev] SMTP gửi thất bại. ${options.fallbackLog ?? ''}`);
        return;
      }
      throw error;
    }
  }

  /**
   * Gửi email chứa mã OTP xác minh tài khoản khi đăng ký.
   */
  static async sendOtpEmail(email: string, otp: string): Promise<void> {
    await EmailService.send({
      to: email,
      subject: 'CineBook — Xác minh tài khoản của bạn',
      html: EmailTemplates.registerOtp(otp),
      fallbackLog: `[OTP đăng ký] ${email} → ${otp}`,
    });
  }

  /**
   * Gửi email chứa mã OTP đặt lại mật khẩu.
   */
  static async sendResetPasswordOtpEmail(email: string, otp: string): Promise<void> {
    await EmailService.send({
      to: email,
      subject: 'CineBook — Đặt lại mật khẩu',
      html: EmailTemplates.resetPasswordOtp(otp),
      fallbackLog: `[OTP đặt lại MK] ${email} → ${otp}`,
    });
  }

  /**
   * Gửi email chào mừng sau khi tài khoản được xác minh thành công.
   */
  static async sendWelcomeEmail(email: string, fullName: string): Promise<void> {
    await EmailService.send({
      to: email,
      subject: 'Chào mừng bạn đến với CineBook!',
      html: EmailTemplates.welcome(fullName),
    });
  }

  /**
   * Gửi email chứa vé điện tử và mã QR check-in sau khi thanh toán thành công.
   */
  static async sendTicketEmail(email: string, bookingData: any): Promise<void> {
    await EmailService.send({
      to: email,
      subject: `CineBook — Vé điện tử #${bookingData.bookingId}`,
      html: EmailTemplates.ticket(bookingData),
      fallbackLog: `[Vé điện tử] Đã gửi tới ${email} cho Booking #${bookingData.bookingId}`,
    });
  }

  /**
   * Gửi email thông báo hoàn tiền khi hủy vé.
   */
  static async sendRefundEmail(email: string, data: { bookingId: number; refundAmount: number }): Promise<void> {
    await EmailService.send({
      to: email,
      subject: `CineBook — Hoàn tiền đơn hàng #${data.bookingId}`,
      html: EmailTemplates.refund(data),
      fallbackLog: `[Hoàn tiền] Đã gửi tới ${email} cho Booking #${data.bookingId} — ${data.refundAmount}đ`,
    });
  }

  /**
   * Gửi email tùy chỉnh — dùng bởi NotificationService.
   * Nhận subject + HTML body bất kỳ.
   */
  static async sendCustomEmail(email: string, subject: string, html: string): Promise<void> {
    await EmailService.send({
      to: email,
      subject,
      html,
      fallbackLog: `[Custom] ${subject} → ${email}`,
    });
  }
}


