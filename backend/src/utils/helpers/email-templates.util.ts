const APP_NAME = 'CineBook';
const BRAND_COLOR = '#E53935';
const BRAND_DARK = '#B71C1C';
const FOOTER_TEXT = `© ${new Date().getFullYear()} ${APP_NAME}. Tất cả quyền được bảo lưu.`;

/**
 * Layout wrapper dùng chung cho toàn bộ email.
 * Inline CSS là bắt buộc vì các email client (Gmail, Outlook) không hỗ trợ external stylesheet.
 */
const wrapLayout = (title: string, content: string): string => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_COLOR},${BRAND_DARK});padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:1px;">
                🎬 ${APP_NAME}
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
                Hệ thống đặt vé xem phim trực tuyến
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eeeeee;text-align:center;">
              <p style="margin:0;color:#999999;font-size:12px;">${FOOTER_TEXT}</p>
              <p style="margin:6px 0 0;color:#bbbbbb;font-size:11px;">
                Nếu bạn không thực hiện hành động này, vui lòng bỏ qua email này.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Block hiển thị OTP nổi bật dùng chung.
 */
const otpBlock = (otp: string): string => `
  <div style="margin:28px 0;text-align:center;">
    <div style="display:inline-block;background:#fff8f8;border:2px dashed ${BRAND_COLOR};border-radius:12px;padding:18px 48px;">
      <span style="font-size:38px;font-weight:800;color:${BRAND_COLOR};letter-spacing:10px;font-family:monospace;">
        ${otp}
      </span>
    </div>
    <p style="margin:12px 0 0;color:#888888;font-size:13px;">
      ⏰ Mã có hiệu lực trong <strong>5 phút</strong>
    </p>
  </div>
`;

/**
 * Template xác minh tài khoản khi đăng ký (OTP).
 */
const registerOtp = (otp: string): string => {
  const content = `
    <h2 style="margin:0 0 8px;color:#222222;font-size:22px;font-weight:700;">
      Xác minh tài khoản của bạn
    </h2>
    <p style="margin:0 0 20px;color:#555555;font-size:15px;line-height:1.6;">
      Chào mừng bạn đến với <strong>${APP_NAME}</strong>! Để hoàn tất đăng ký, vui lòng nhập mã OTP bên dưới:
    </p>

    ${otpBlock(otp)}

    <p style="margin:0;color:#777777;font-size:14px;line-height:1.6;">
      Vì lý do bảo mật, <strong>không chia sẻ mã này</strong> với bất kỳ ai, kể cả nhân viên ${APP_NAME}.
    </p>
  `;
  return wrapLayout(`Xác minh tài khoản — ${APP_NAME}`, content);
};

/**
 * Template đặt lại mật khẩu (OTP).
 */
const resetPasswordOtp = (otp: string): string => {
  const content = `
    <h2 style="margin:0 0 8px;color:#222222;font-size:22px;font-weight:700;">
      Đặt lại mật khẩu
    </h2>
    <p style="margin:0 0 20px;color:#555555;font-size:15px;line-height:1.6;">
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhập mã OTP bên dưới để tiếp tục:
    </p>

    ${otpBlock(otp)}

    <div style="background:#fffde7;border-left:4px solid #FFC107;padding:14px 18px;border-radius:4px;margin-top:24px;">
      <p style="margin:0;color:#795548;font-size:13px;line-height:1.6;">
        ⚠️ Nếu bạn <strong>không yêu cầu</strong> đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu của bạn vẫn an toàn.
      </p>
    </div>
  `;
  return wrapLayout(`Đặt lại mật khẩu — ${APP_NAME}`, content);
};

/**
 * Template email chào mừng sau khi đăng ký thành công.
 */
const welcome = (fullName: string): string => {
  const content = `
    <h2 style="margin:0 0 8px;color:#222222;font-size:22px;font-weight:700;">
      Chào mừng, ${fullName}! 🎉
    </h2>
    <p style="margin:0 0 20px;color:#555555;font-size:15px;line-height:1.6;">
      Tài khoản của bạn đã được xác minh thành công. Bạn có thể bắt đầu trải nghiệm dịch vụ đặt vé xem phim trực tuyến ngay hôm nay.
    </p>

    <div style="background:#f8f9fa;border-radius:8px;padding:24px;margin:24px 0;">
      <p style="margin:0 0 12px;color:#333333;font-weight:600;font-size:15px;">
        Bạn có thể:
      </p>
      <ul style="margin:0;padding:0 0 0 20px;color:#555555;font-size:14px;line-height:2;">
        <li>🎬 Xem danh sách phim đang chiếu</li>
        <li>🪑 Chọn ghế và đặt vé trực tuyến</li>
        <li>💳 Thanh toán QR hoặc thẻ tín dụng</li>
        <li>🎟️ Nhận vé điện tử ngay sau khi thanh toán</li>
        <li>⭐ Tích điểm thưởng với mỗi giao dịch</li>
      </ul>
    </div>

    <div style="text-align:center;margin-top:12px;">
      <a href="#"
         style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:15px;font-weight:600;">
        Khám phá ngay
      </a>
    </div>
  `;
  return wrapLayout(`Chào mừng đến với ${APP_NAME}`, content);
};

/**
 * Template vé điện tử chứa thông tin đặt vé và QR code check-in (mock).
 */
const ticket = (bookingData: any): string => {
  const content = `
    <h2 style="margin:0 0 8px;color:#222222;font-size:22px;font-weight:700;">
      Vé Điện Tử Của Bạn 🎟️
    </h2>
    <p style="margin:0 0 20px;color:#555555;font-size:15px;line-height:1.6;">
      Cảm ơn bạn đã đặt vé tại <strong>${APP_NAME}</strong>. Vui lòng đưa mã QR này cho nhân viên soát vé khi đến rạp.
    </p>

    <div style="background:#f8f9fa;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 12px;color:#333333;font-weight:600;font-size:16px;">
        Mã Đơn Hàng: #${bookingData.bookingId}
      </p>
      
      <!-- Giả lập hình ảnh QR code -->
      <div style="margin:20px auto;width:200px;height:200px;background:#fff;padding:10px;border:1px solid #ddd;border-radius:8px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${bookingData.bookingId}" alt="QR Check-in" style="width:100%;height:100%;object-fit:cover;" />
      </div>

      <p style="margin:12px 0 0;color:#555555;font-size:14px;">
        <strong>Phim:</strong> ${bookingData.movieTitle || 'Đang cập nhật'}<br/>
        <strong>Ghế:</strong> ${bookingData.seats || 'Đang cập nhật'}<br/>
        <strong>Tổng tiền:</strong> ${bookingData.amount?.toLocaleString('vi-VN')}đ
      </p>
    </div>
  `;
  return wrapLayout(`Vé Điện Tử — ${APP_NAME}`, content);
};

export const EmailTemplates = {
  registerOtp,
  resetPasswordOtp,
  welcome,
  ticket,
};
