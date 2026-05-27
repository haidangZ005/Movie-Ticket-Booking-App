import { NotificationModel, NotificationType } from '../models/notification.model';
import { CustomerModel } from '../models/customer.model';
import { EmailService } from './email.service';

/**
 * NotificationService — Trung tâm phát thông báo.
 * Khi một sự kiện xảy ra (đặt vé, thanh toán, hủy vé, hoàn tiền), các service khác
 * (PaymentService, CancelService) gọi hàm tương ứng ở đây.
 *
 * Flow: Tạo DB record → Gửi email (nếu có) → Push FCM (nếu có)
 *       Nếu email/FCM lỗi thì bỏ qua, không ảnh hưởng DB.
 */
export class NotificationService {

  /**
   * Hàm cốt lõi: tạo notification trong DB + gửi email (tùy chọn).
   * Push FCM placeholder — TV2 sẽ tích hợp Firebase Admin SDK.
   */
  static async send(options: {
    customerId: number;
    title: string;
    message: string;
    type: NotificationType;
    email?: string;          // Nếu truyền → gửi email thông báo
    emailSubject?: string;
    emailHtml?: string;
  }) {
    // 1. Lưu notification vào DB
    const notification = await NotificationModel.create({
      customerId: options.customerId,
      title: options.title,
      message: options.message,
      type: options.type,
    });

    // 2. Gửi email thông báo (nếu có)
    if (options.email && options.emailHtml) {
      try {
        await EmailService.sendCustomEmail(
          options.email,
          options.emailSubject || options.title,
          options.emailHtml
        );
      } catch (err) {
        console.error(`[NotificationService] Email failed for Customer #${options.customerId}:`, err);
      }
    }

    // 3. Push FCM (placeholder — TV2 sẽ tích hợp Firebase Admin SDK)
    // Khi TV2 hoàn thành push.service.ts, gọi:
    // await PushService.sendToCustomer(options.customerId, options.title, options.message);

    return notification;
  }

  // ===========================================================
  // CONVENIENCE METHODS — gọi từ các service khác (TV3, TV4)
  // ===========================================================

  /**
   * Gửi thông báo đặt vé thành công.
   * Gọi bởi PaymentService.handleWebhook khi status = SUCCESS.
   */
  static async notifyBookingSuccess(customerId: number, email: string, bookingId: number, movieTitle: string) {
    return this.send({
      customerId,
      title: 'Đặt vé thành công 🎬',
      message: `Bạn đã đặt vé thành công cho phim "${movieTitle}". Mã đơn hàng: #${bookingId}`,
      type: 'BOOKING',
      email,
      emailSubject: `CineBook — Xác nhận đặt vé #${bookingId}`,
    });
  }

  /**
   * Gửi thông báo hủy vé.
   * Gọi bởi CancelService (TV3) khi booking bị hủy.
   */
  static async notifyBookingCancelled(customerId: number, email: string, bookingId: number) {
    return this.send({
      customerId,
      title: 'Hủy vé thành công',
      message: `Đơn hàng #${bookingId} đã được hủy. Số tiền hoàn sẽ được chuyển trong 3-5 ngày.`,
      type: 'CANCEL',
      email,
      emailSubject: `CineBook — Xác nhận hủy vé #${bookingId}`,
    });
  }

  /**
   * Gửi thông báo hoàn tiền thành công.
   * Gọi bởi PaymentService.processRefund.
   */
  static async notifyRefundSuccess(customerId: number, email: string, bookingId: number, refundAmount: number) {
    return this.send({
      customerId,
      title: 'Hoàn tiền thành công 💰',
      message: `Đơn hàng #${bookingId} đã được hoàn ${refundAmount.toLocaleString('vi-VN')}đ về tài khoản.`,
      type: 'REFUND',
      email,
      emailSubject: `CineBook — Hoàn tiền đơn hàng #${bookingId}`,
    });
  }

  /**
   * Gửi thông báo thanh toán thành công.
   */
  static async notifyPaymentSuccess(customerId: number, email: string, bookingId: number, amount: number) {
    return this.send({
      customerId,
      title: 'Thanh toán thành công ✅',
      message: `Bạn đã thanh toán ${amount.toLocaleString('vi-VN')}đ cho đơn hàng #${bookingId}.`,
      type: 'PAYMENT',
      email,
      emailSubject: `CineBook — Xác nhận thanh toán #${bookingId}`,
    });
  }

  /**
   * Gửi thông báo chung (khuyến mãi, hệ thống, v.v.)
   */
  static async notifyGeneral(customerId: number, title: string, message: string, type: NotificationType = 'SYSTEM') {
    return this.send({ customerId, title, message, type });
  }

  // ===========================================================
  // BROADCAST — Gửi thông báo đến NHIỀU khách hàng
  // ===========================================================

  /**
   * Gửi thông báo phim mới đến tất cả khách đã xác minh.
   * Gọi bởi movie.controller khi admin thêm phim mới.
   */
  static async notifyNewMovie(movieTitle: string, movieId: number) {
    const customers = await CustomerModel.getAllVerifiedCustomers();

    const promises = customers.map(customer =>
      this.send({
        customerId: customer.CustomerID,
        title: 'Phim mới vừa ra mắt 🎬',
        message: `Phim "${movieTitle}" vừa được thêm vào danh sách. Đặt vé ngay để không bỏ lỡ!`,
        type: 'PROMO',
        email: customer.Email,
        emailSubject: `CineBook — Phim mới: ${movieTitle}`,
      }).catch(err => {
        console.error(`[NotificationService] notifyNewMovie failed for Customer #${customer.CustomerID}:`, err);
      })
    );

    await Promise.allSettled(promises);
    console.log(`[NotificationService] notifyNewMovie: đã gửi ${customers.length} thông báo phim "${movieTitle}"`);
  }

  /**
   * Gửi thông báo voucher mới đến tất cả khách đã xác minh.
   * Gọi bởi voucher.controller khi admin tạo voucher mới.
   */
  static async notifyNewVoucher(voucherCode: string, discount: string, endDate: string) {
    const customers = await CustomerModel.getAllVerifiedCustomers();

    const promises = customers.map(customer =>
      this.send({
        customerId: customer.CustomerID,
        title: 'Voucher mới dành cho bạn 🎁',
        message: `Bạn có voucher giảm ${discount}. Mã: ${voucherCode}. Sử dụng trước ngày ${endDate}!`,
        type: 'PROMO',
        email: customer.Email,
        emailSubject: `CineBook — Voucher mới: Giảm ${discount}!`,
      }).catch(err => {
        console.error(`[NotificationService] notifyNewVoucher failed for Customer #${customer.CustomerID}:`, err);
      })
    );

    await Promise.allSettled(promises);
    console.log(`[NotificationService] notifyNewVoucher: đã gửi ${customers.length} thông báo voucher "${voucherCode}"`);
  }
}
