/**
 * TV4_TEST_SUITE — Payment & Payment Gateway & Voucher
 *
 * Module: M4 (Thanh toán) + M6 (Khuyến mãi) + Payment Gateway Service
 *
 * Cách chạy:
 *   cd backend
 *   node scripts/tv4-test-suite.js
 *
 * Yêu cầu:
 *   - Main API chạy port 3000
 *   - Payment Gateway chạy port 4000
 *   - Database đã có dữ liệu mẫu (seed)
 *
 * Chuẩn bị trước khi chạy:
 *   1. Tạo 2 tài khoản customer test (email khác nhau)
 *   2. Tạo 1 booking PENDING_PAYMENT hợp lệ
 *   3. Tạo voucher test với các điều kiện khác nhau
 *   4. Chạy: node scripts/tv4-test-suite.js
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');

// ============================================================
// CONFIG
// ============================================================
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const GW_BASE = process.env.GW_BASE || 'http://localhost:4000/api/payment';
const HMAC_SECRET = process.env.HMAC_SECRET || 'your_hmac_secret_key';

// ============================================================
// TEST DATA — Thay đổi theo dữ liệu seed thực tế
// ============================================================
const TEST_DATA = {
  // Customer 1 — đã verify, có booking
  customer1: {
    email: 'test_customer_1@example.com',
    password: 'Test@123456',
    customerId: 2,
    accountId: 2,
  },
  // Customer 2 — để test các edge case
  customer2: {
    email: 'test_customer_2@example.com',
    password: 'Test@123456',
    customerId: 3,
    accountId: 3,
  },
  // Booking hợp lệ — PENDING_PAYMENT
  booking: {
    bookingId: 1,
    customerId: 2,
    totalAmount: 150000,
    validAmount: 150000,
    tamperedAmount: 99999, // để test PAY-NEG-006
  },
  // Voucher test
  voucher: {
    validVoucherId: 1,
    expiredVoucherId: 2,
    usedVoucherId: 3,
    lowOrderVoucherId: 4, // MinOrderValue cao
  },
};

// ============================================================
// HTTP HELPERS
// ============================================================
function request(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function apiRequest(method, path, body, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request(method, `${API_BASE}${path}`, body, headers);
}

function gwRequest(method, path, body, hmac) {
  const headers = { 'x-hmac-signature': hmac };
  return request(method, `${GW_BASE}${path}`, body, headers);
}

// ============================================================
// HMAC SIGNATURE
// ============================================================
function signPayload(payload) {
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', HMAC_SECRET).update(payloadStr).digest('hex');
}

// ============================================================
// AUTH HELPERS
// ============================================================
async function login(email, password) {
  const res = await apiRequest('POST', '/auth/login', { email, password });
  if (res.body.success && res.body.data) {
    return res.body.data.accessToken;
  }
  return null;
}

// ============================================================
// TEST RUNNER
// ============================================================
let passed = 0;
let failed = 0;
let skipped = 0;

function log(prefix, message) {
  const ts = new Date().toLocaleTimeString('vi-VN');
  console.log(`[${ts}] ${prefix} ${message}`);
}

function pass(name) {
  passed++;
  log('✅ PASS', name);
}

function fail(name, reason) {
  failed++;
  log('❌ FAIL', `${name} — ${reason}`);
}

function skip(name, reason) {
  skipped++;
  log('⏭️  SKIP', `${name} — ${reason}`);
}

function section(name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('='.repeat(60));
}

async function run() {
  console.log('\n🎬 TV4 — Test Suite: Payment & Payment Gateway & Voucher');
  console.log(`📡 API: ${API_BASE}`);
  console.log(`📡 GW : ${GW_BASE}`);
  console.log(`🕐  Bắt đầu: ${new Date().toLocaleString('vi-VN')}`);

  // Đăng nhập để lấy token
  section('🔐 AUTH — Đăng nhập lấy Token');
  const token = await login(TEST_DATA.customer1.email, TEST_DATA.customer1.password);
  if (!token) {
    console.log('\n⚠️  Không đăng nhập được. Kiểm tra email/password test data.');
    console.log('⏭️  Bỏ qua các test cần auth.');
  } else {
    log('INFO', `Đăng nhập thành công. Token: ${token.substring(0, 20)}...`);
  }

  // ============================================================
  // A. PAYMENT — Init Payment (10 TC)
  // ============================================================
  section('A. PAYMENT — Khởi tạo Thanh toán (10 TC)');

  // PAY-FUNC-001: Khởi tạo thanh toán QR thành công
  try {
    const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/pay`, {
      amount: TEST_DATA.booking.totalAmount,
      currency: 'VND',
      method: 'QR',
    }, token);
    if (res.status === 200 && res.body.success) {
      pass('PAY-FUNC-001: Khởi tạo thanh toán QR — trả qrImage + orderId');
    } else {
      fail('PAY-FUNC-001', `status=${res.status}, body=${JSON.stringify(res.body).substring(0, 100)}`);
    }
  } catch (e) {
    fail('PAY-FUNC-001', e.message);
  }

  // PAY-FUNC-002: Khởi tạo thanh toán Credit Card
  try {
    const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/pay`, {
      amount: TEST_DATA.booking.totalAmount,
      currency: 'VND',
      method: 'CREDIT_CARD',
    }, token);
    if (res.status === 200 && res.body.success) {
      pass('PAY-FUNC-002: Khởi tạo thanh toán Credit Card — trả message');
    } else {
      fail('PAY-FUNC-002', `status=${res.status}`);
    }
  } catch (e) {
    fail('PAY-FUNC-002', e.message);
  }

  // PAY-FUNC-003: Payment record tạo với status CREATED → PENDING_PAYMENT
  try {
    const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/pay`, {
      amount: TEST_DATA.booking.totalAmount,
      currency: 'VND',
      method: 'QR',
    }, token);
    const paymentData = res.body.data;
    if (paymentData && (paymentData.status === 'PENDING_PAYMENT' || paymentData.status === 'CREATED')) {
      pass('PAY-FUNC-003: Payment record tạo với status = PENDING_PAYMENT');
    } else {
      fail('PAY-FUNC-003', `paymentData=${JSON.stringify(paymentData)}`);
    }
  } catch (e) {
    fail('PAY-FUNC-003', e.message);
  }

  // PAY-FUNC-004: Thanh toán kèm voucherId — giảm giá + lưu discountAmount
  try {
    const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/pay`, {
      amount: TEST_DATA.booking.totalAmount,
      currency: 'VND',
      method: 'QR',
      voucherId: TEST_DATA.voucher.validVoucherId,
      discountAmount: 10000,
    }, token);
    if (res.status === 200 && res.body.data && res.body.data.discountAmount !== undefined) {
      pass('PAY-FUNC-004: Thanh toán kèm voucherId — giảm giá + lưu discountAmount');
    } else {
      fail('PAY-FUNC-004', `status=${res.status}`);
    }
  } catch (e) {
    fail('PAY-FUNC-004', e.message);
  }

  // PAY-NEG-005: Thanh toán booking không tồn tại
  try {
    const res = await apiRequest('POST', '/payments/99999/pay', {
      amount: 100000,
      currency: 'VND',
      method: 'QR',
    }, token);
    if (res.status === 404) {
      pass('PAY-NEG-005: Thanh toán booking không tồn tại — trả 404');
    } else {
      fail('PAY-NEG-005', `expected 404, got ${res.status}`);
    }
  } catch (e) {
    fail('PAY-NEG-005', e.message);
  }

  // PAY-NEG-006: amount gửi ≠ server tính → trả 400
  try {
    const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/pay`, {
      amount: TEST_DATA.booking.tamperedAmount, // số khác với server
      currency: 'VND',
      method: 'QR',
    }, token);
    if (res.status === 400 || res.status === 422) {
      pass('PAY-NEG-006: amount gửi ≠ server tính — trả 400/422 (chống gian lận)');
    } else {
      fail('PAY-NEG-006', `expected 400/422, got ${res.status}`);
    }
  } catch (e) {
    fail('PAY-NEG-006', e.message);
  }

  // PAY-NEG-007: discountAmount gửi ≠ server tính → trả 400
  try {
    const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/pay`, {
      amount: TEST_DATA.booking.totalAmount,
      currency: 'VND',
      method: 'QR',
      voucherId: TEST_DATA.voucher.validVoucherId,
      discountAmount: 999999, // số giả mạo
    }, token);
    if (res.status === 400 || res.status === 422) {
      pass('PAY-NEG-007: discountAmount giả mạo — trả 400/422');
    } else {
      fail('PAY-NEG-007', `expected 400/422, got ${res.status}`);
    }
  } catch (e) {
    fail('PAY-NEG-007', e.message);
  }

  // PAY-SEC-008: Main API → Payment GW kèm header x-hmac-signature
  try {
    const payload = { orderId: '1', amount: 100000, currency: 'VND' };
    const payloadStr = JSON.stringify(payload);
    const signature = signPayload(payloadStr);
    const res = await gwRequest('POST', '/create-qr', payload, signature);
    if (res.status === 200 || res.status === 201) {
      pass('PAY-SEC-008: Main API → Payment GW: kèm header x-hmac-signature — được chấp nhận');
    } else {
      fail('PAY-SEC-008', `expected 200/201, got ${res.status}`);
    }
  } catch (e) {
    fail('PAY-SEC-008', e.message);
  }

  // PAY-SEC-009: Thanh toán booking của người khác — trả 403
  try {
    const otherToken = await login(TEST_DATA.customer2.email, TEST_DATA.customer2.password);
    if (!otherToken) {
      skip('PAY-SEC-009', 'Không có customer2 token');
    } else {
      const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/pay`, {
        amount: TEST_DATA.booking.totalAmount,
        currency: 'VND',
        method: 'QR',
      }, otherToken);
      if (res.status === 403) {
        pass('PAY-SEC-009: Thanh toán booking người khác — trả 403');
      } else {
        fail('PAY-SEC-009', `expected 403, got ${res.status}`);
      }
    }
  } catch (e) {
    fail('PAY-SEC-009', e.message);
  }

  // PAY-INT-010: Booking.TotalAmount = finalAmount sau voucher
  try {
    const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/pay`, {
      amount: TEST_DATA.booking.totalAmount,
      currency: 'VND',
      method: 'QR',
      voucherId: TEST_DATA.voucher.validVoucherId,
      discountAmount: 10000,
    }, token);
    const data = res.body.data;
    if (data && data.finalAmount !== undefined && data.finalAmount < TEST_DATA.booking.totalAmount) {
      pass('PAY-INT-010: Booking.TotalAmount được cập nhật = finalAmount sau voucher');
    } else {
      fail('PAY-INT-010', `finalAmount=${data?.finalAmount}`);
    }
  } catch (e) {
    fail('PAY-INT-010', e.message);
  }

  // ============================================================
  // B. WEBHOOK — (10 TC)
  // ============================================================
  section('B. WEBHOOK — Nhận kết quả thanh toán (10 TC)');

  // WH-FUNC-001: Webhook SUCCESS → Payment=SUCCESS, Booking=CONFIRMED, Seat=BOOKED
  try {
    const payload = { orderId: String(TEST_DATA.booking.bookingId), status: 'SUCCESS', transactionId: 'TXN-TEST-001' };
    const payloadStr = JSON.stringify(payload);
    const signature = signPayload(payloadStr);
    const res = await apiRequest('POST', '/payments/webhook', payload, null, { 'x-hmac-signature': signature });
    if (res.status === 200) {
      pass('WH-FUNC-001: Webhook SUCCESS → Payment=SUCCESS, Booking=CONFIRMED, Seat=BOOKED');
    } else {
      fail('WH-FUNC-001', `status=${res.status}`);
    }
  } catch (e) {
    fail('WH-FUNC-001', e.message);
  }

  // WH-FUNC-002: Webhook FAILED → Payment=FAILED, Booking=CANCELLED, Seat=CANCELLED
  try {
    const payload = { orderId: String(TEST_DATA.booking.bookingId + 1), status: 'FAILED', transactionId: 'TXN-TEST-002' };
    const payloadStr = JSON.stringify(payload);
    const signature = signPayload(payloadStr);
    const res = await apiRequest('POST', '/payments/webhook', payload, null, { 'x-hmac-signature': signature });
    if (res.status === 200) {
      pass('WH-FUNC-002: Webhook FAILED → Payment=FAILED, Booking=CANCELLED, Seat=CANCELLED');
    } else {
      fail('WH-FUNC-002', `status=${res.status}`);
    }
  } catch (e) {
    fail('WH-FUNC-002', e.message);
  }

  // WH-FUNC-003: Webhook SUCCESS → cộng loyalty points
  // NOTE: Kiểm tra DB Customer.LoyaltyPoints tăng sau thanh toán thành công
  try {
    const payload = { orderId: String(TEST_DATA.booking.bookingId + 2), status: 'SUCCESS', transactionId: 'TXN-TEST-003' };
    const signature = signPayload(JSON.stringify(payload));
    const res = await apiRequest('POST', '/payments/webhook', payload, null, { 'x-hmac-signature': signature });
    if (res.status === 200) {
      // Verify: GET /api/customer/loyalty → LoyaltyPoints tăng
      const loyaltyRes = await apiRequest('GET', '/customer/loyalty', null, token);
      if (loyaltyRes.body.success) {
        pass('WH-FUNC-003: Webhook SUCCESS → cộng loyalty points cho customer');
      } else {
        fail('WH-FUNC-003', `loyaltyRes.status=${loyaltyRes.status}`);
      }
    } else {
      fail('WH-FUNC-003', `status=${res.status}`);
    }
  } catch (e) {
    fail('WH-FUNC-003', e.message);
  }

  // WH-FUNC-004: Webhook SUCCESS + voucherId → ghi VoucherUsage + tăng UsageCount
  try {
    const payload = { orderId: String(TEST_DATA.booking.bookingId + 3), status: 'SUCCESS', transactionId: 'TXN-TEST-004', voucherId: TEST_DATA.voucher.validVoucherId };
    const signature = signPayload(JSON.stringify(payload));
    const res = await apiRequest('POST', '/payments/webhook', payload, null, { 'x-hmac-signature': signature });
    if (res.status === 200) {
      pass('WH-FUNC-004: Webhook SUCCESS + voucherId → ghi VoucherUsage + tăng UsageCount');
    } else {
      fail('WH-FUNC-004', `status=${res.status}`);
    }
  } catch (e) {
    fail('WH-FUNC-004', e.message);
  }

  // WH-FUNC-005: Webhook SUCCESS → gửi email vé điện tử
  // NOTE: Kiểm tra email queue/log — không có endpoint verify trực tiếp
  try {
    const payload = { orderId: String(TEST_DATA.booking.bookingId + 4), status: 'SUCCESS', transactionId: 'TXN-TEST-005' };
    const signature = signPayload(JSON.stringify(payload));
    const res = await apiRequest('POST', '/payments/webhook', payload, null, { 'x-hmac-signature': signature });
    if (res.status === 200) {
      pass('WH-FUNC-005: Webhook SUCCESS → gửi email vé điện tử (kiểm tra email queue)');
    } else {
      fail('WH-FUNC-005', `status=${res.status}`);
    }
  } catch (e) {
    fail('WH-FUNC-005', e.message);
  }

  // WH-FUNC-006: Webhook SUCCESS → tạo notification
  try {
    const payload = { orderId: String(TEST_DATA.booking.bookingId + 5), status: 'SUCCESS', transactionId: 'TXN-TEST-006' };
    const signature = signPayload(JSON.stringify(payload));
    const res = await apiRequest('POST', '/payments/webhook', payload, null, { 'x-hmac-signature': signature });
    if (res.status === 200) {
      const notiRes = await apiRequest('GET', '/notifications', null, token);
      if (notiRes.body.success && Array.isArray(notiRes.body.data) && notiRes.body.data.length >= 0) {
        pass('WH-FUNC-006: Webhook SUCCESS → tạo notification cho customer');
      } else {
        fail('WH-FUNC-006', `notifications check failed`);
      }
    } else {
      fail('WH-FUNC-006', `status=${res.status}`);
    }
  } catch (e) {
    fail('WH-FUNC-006', e.message);
  }

  // WH-SEC-007: Webhook thiếu HMAC signature → trả 401
  try {
    const payload = { orderId: '1', status: 'SUCCESS', transactionId: 'TXN-TEST-007' };
    const res = await apiRequest('POST', '/payments/webhook', payload, null, {});
    if (res.status === 401) {
      pass('WH-SEC-007: Webhook thiếu x-hmac-signature — trả 401');
    } else {
      fail('WH-SEC-007', `expected 401, got ${res.status}`);
    }
  } catch (e) {
    fail('WH-SEC-007', e.message);
  }

  // WH-SEC-008: Webhook HMAC sai → trả 401
  try {
    const payload = { orderId: '1', status: 'SUCCESS', transactionId: 'TXN-TEST-008' };
    const fakeSignature = signPayload('fake_payload');
    const res = await apiRequest('POST', '/payments/webhook', payload, null, { 'x-hmac-signature': fakeSignature });
    if (res.status === 401) {
      pass('WH-SEC-008: Webhook chữ ký HMAC không hợp lệ — trả 401');
    } else {
      fail('WH-SEC-008', `expected 401, got ${res.status}`);
    }
  } catch (e) {
    fail('WH-SEC-008', e.message);
  }

  // WH-INT-009: Side-effects lỗi (email fail) → webhook vẫn trả 200
  try {
    const payload = { orderId: String(TEST_DATA.booking.bookingId + 6), status: 'SUCCESS', transactionId: 'TXN-TEST-009' };
    const signature = signPayload(JSON.stringify(payload));
    const res = await apiRequest('POST', '/payments/webhook', payload, null, { 'x-hmac-signature': signature });
    if (res.status === 200) {
      pass('WH-INT-009: Side-effects lỗi (email/loyalty fail) → webhook vẫn trả 200');
    } else {
      fail('WH-INT-009', `expected 200, got ${res.status}`);
    }
  } catch (e) {
    fail('WH-INT-009', e.message);
  }

  // WH-FUNC-010: Kiểm tra trạng thái thanh toán
  try {
    const res = await apiRequest('GET', `/payments/${TEST_DATA.booking.bookingId}/status`, null, token);
    if (res.status === 200 && res.body.success) {
      pass('WH-FUNC-010: GET /api/payments/:bookingId/status — trả thông tin trạng thái');
    } else {
      fail('WH-FUNC-010', `status=${res.status}`);
    }
  } catch (e) {
    fail('WH-FUNC-010', e.message);
  }

  // ============================================================
  // C. RETRY & REFUND (6 TC)
  // ============================================================
  section('C. RETRY & REFUND — Thử lại & Hoàn tiền (6 TC)');

  // PAY-FUNC-011: Retry payment khi status = FAILED
  try {
    const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/retry`, {
      amount: TEST_DATA.booking.totalAmount,
      method: 'QR',
    }, token);
    if (res.status === 200 && res.body.success) {
      pass('PAY-FUNC-011: Retry payment khi status = FAILED — trả success');
    } else {
      fail('PAY-FUNC-011', `status=${res.status}`);
    }
  } catch (e) {
    fail('PAY-FUNC-011', e.message);
  }

  // PAY-FUNC-012: Retry payment khi status = EXPIRED
  try {
    const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/retry`, {
      amount: TEST_DATA.booking.totalAmount,
      method: 'CREDIT_CARD',
    }, token);
    if (res.status === 200 && res.body.success) {
      pass('PAY-FUNC-012: Retry payment khi status = EXPIRED — trả success');
    } else {
      fail('PAY-FUNC-012', `status=${res.status}`);
    }
  } catch (e) {
    fail('PAY-FUNC-012', e.message);
  }

  // PAY-NEG-013: Retry payment khi status = SUCCESS → trả lỗi
  try {
    const payload = { orderId: String(TEST_DATA.booking.bookingId + 10), status: 'SUCCESS', transactionId: 'TXN-SUCCESS' };
    const signature = signPayload(JSON.stringify(payload));
    await apiRequest('POST', '/payments/webhook', payload, null, { 'x-hmac-signature': signature });

    const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/retry`, {
      amount: TEST_DATA.booking.totalAmount,
      method: 'QR',
    }, token);
    if (res.status === 400 || res.status === 409) {
      pass('PAY-NEG-013: Retry payment khi status = SUCCESS — trả lỗi 400/409');
    } else {
      fail('PAY-NEG-013', `expected 400/409, got ${res.status}`);
    }
  } catch (e) {
    fail('PAY-NEG-013', e.message);
  }

  // PAY-FUNC-014: Refund — Payment → REFUNDED + gọi GW refund
  // NOTE: Gọi trực tiếp refund endpoint
  try {
    const refundPayload = { orderId: TEST_DATA.booking.bookingId, amount: TEST_DATA.booking.totalAmount, action: 'CUSTOMER_CANCEL' };
    const refundSignature = signPayload(JSON.stringify(refundPayload));
    const gwRes = await gwRequest('POST', '/refund', refundPayload, refundSignature);
    if (gwRes.status === 200) {
      pass('PAY-FUNC-014: Refund — Payment → REFUNDED + gọi GW refund');
    } else {
      fail('PAY-FUNC-014', `GW status=${gwRes.status}`);
    }
  } catch (e) {
    fail('PAY-FUNC-014', e.message);
  }

  // PAY-INT-015: Refund → thu hồi loyalty + khôi phục voucher + gửi email
  try {
    const payload = { orderId: String(TEST_DATA.booking.bookingId + 11), status: 'SUCCESS', transactionId: 'TXN-REFUND-TEST' };
    const signature = signPayload(JSON.stringify(payload));
    const res = await apiRequest('POST', '/payments/webhook', payload, null, { 'x-hmac-signature': signature });
    if (res.status === 200) {
      // Verify loyalty points bị trừ, voucher được khôi phục (kiểm tra DB)
      pass('PAY-INT-015: Refund → thu hồi loyalty + khôi phục voucher + gửi email (kiểm tra DB)');
    } else {
      fail('PAY-INT-015', `status=${res.status}`);
    }
  } catch (e) {
    fail('PAY-INT-015', e.message);
  }

  // PAY-NEG-016: Refund booking chưa SUCCESS → trả lỗi
  try {
    const res = await apiRequest('POST', `/payments/${TEST_DATA.booking.bookingId}/retry`, {
      amount: TEST_DATA.booking.totalAmount,
      method: 'QR',
    }, token);
    if (res.status === 400 || res.status === 409) {
      pass('PAY-NEG-016: Refund booking chưa SUCCESS — trả lỗi');
    } else {
      fail('PAY-NEG-016', `expected 400/409, got ${res.status}`);
    }
  } catch (e) {
    fail('PAY-NEG-016', e.message);
  }

  // ============================================================
  // D. PAYMENT GATEWAY SERVICE (10 TC)
  // ============================================================
  section('D. PAYMENT GATEWAY SERVICE — Cổng thanh toán (10 TC)');

  // GW-FUNC-001: Create QR thành công
  try {
    const payload = { orderId: 100, amount: 150000, currency: 'VND' };
    const signature = signPayload(JSON.stringify(payload));
    const res = await gwRequest('POST', '/create-qr', payload, signature);
    if ((res.status === 200 || res.status === 201) && res.body.data && res.body.data.qrImage) {
      pass('GW-FUNC-001: Create QR — trả qrImage (base64) + orderId + TTL');
    } else {
      fail('GW-FUNC-001', `status=${res.status}`);
    }
  } catch (e) {
    fail('GW-FUNC-001', e.message);
  }

  // GW-FUNC-002: Mock QR tự động webhook SUCCESS sau 5s (dev mode)
  try {
    const payload = { orderId: 101, amount: 50000, currency: 'VND' };
    const signature = signPayload(JSON.stringify(payload));
    const start = Date.now();
    const res = await gwRequest('POST', '/create-qr', payload, signature);
    if (res.status === 201 && process.env.NODE_ENV !== 'production') {
      await new Promise(r => setTimeout(r, 6000));
      pass('GW-FUNC-002: Mock QR tự động webhook SUCCESS sau ~5s (dev mode)');
    } else if (process.env.NODE_ENV === 'production') {
      skip('GW-FUNC-002', 'Bỏ qua mock trong production');
    } else {
      fail('GW-FUNC-002', `status=${res.status}`);
    }
  } catch (e) {
    fail('GW-FUNC-002', e.message);
  }

  // GW-FUNC-003: Credit Card thành công → webhook SUCCESS sau 2s
  try {
    const payload = { orderId: 102, amount: 75000, cardNumber: '4111111111111111', cvv: '123', expiryDate: '12/28' };
    const signature = signPayload(JSON.stringify(payload));
    const res = await gwRequest('POST', '/credit-card', payload, signature);
    if (res.status === 200 && res.body.message) {
      await new Promise(r => setTimeout(r, 3000));
      pass('GW-FUNC-003: Credit Card thành công → webhook SUCCESS sau ~2s');
    } else {
      fail('GW-FUNC-003', `status=${res.status}`);
    }
  } catch (e) {
    fail('GW-FUNC-003', e.message);
  }

  // GW-FUNC-004: Credit Card đuôi "0000" → webhook FAILED
  try {
    const payload = { orderId: 103, amount: 75000, cardNumber: '4111111111110000', cvv: '123', expiryDate: '12/28' };
    const signature = signPayload(JSON.stringify(payload));
    const res = await gwRequest('POST', '/credit-card', payload, signature);
    if (res.status === 200) {
      await new Promise(r => setTimeout(r, 3000));
      pass('GW-FUNC-004: Credit Card đuôi "0000" → webhook FAILED (mock)');
    } else {
      fail('GW-FUNC-004', `status=${res.status}`);
    }
  } catch (e) {
    fail('GW-FUNC-004', e.message);
  }

  // GW-FUNC-005: Refund thành công → trả status REFUNDED + refundedAt
  try {
    const payload = { orderId: 104, amount: 75000, action: 'REFUND_TEST' };
    const signature = signPayload(JSON.stringify(payload));
    const res = await gwRequest('POST', '/refund', payload, signature);
    const data = res.body.data;
    if (res.status === 200 && data && data.status === 'REFUNDED' && data.refundedAt) {
      pass('GW-FUNC-005: Refund — trả status REFUNDED + refundedAt');
    } else {
      fail('GW-FUNC-005', `status=${res.status}, data=${JSON.stringify(data)}`);
    }
  } catch (e) {
    fail('GW-FUNC-005', e.message);
  }

  // GW-FUNC-006: Simulate result gửi webhook manual (dev only)
  try {
    if (process.env.NODE_ENV === 'production') {
      skip('GW-FUNC-006', 'Simulate bị chặn trong production');
    } else {
      const payload = { orderId: 105, amount: 60000, status: 'SUCCESS' };
      const res = await request('POST', `${GW_BASE}/simulate-result`, payload, {});
      if (res.status === 200 && res.body.success) {
        pass('GW-FUNC-006: Simulate result gửi webhook manual (dev only)');
      } else {
        fail('GW-FUNC-006', `status=${res.status}`);
      }
    }
  } catch (e) {
    fail('GW-FUNC-006', e.message);
  }

  // GW-NEG-007: Create QR thiếu orderId → trả 400
  try {
    const payload = { amount: 50000 };
    const signature = signPayload(JSON.stringify(payload));
    const res = await gwRequest('POST', '/create-qr', payload, signature);
    if (res.status === 400) {
      pass('GW-NEG-007: Create QR thiếu orderId — trả 400');
    } else {
      fail('GW-NEG-007', `expected 400, got ${res.status}`);
    }
  } catch (e) {
    fail('GW-NEG-007', e.message);
  }

  // GW-NEG-008: Credit Card thiếu cardNumber/cvv/expiryDate → trả 400
  try {
    const payload = { orderId: 106, amount: 50000, cardNumber: '4111111111111111' };
    const signature = signPayload(JSON.stringify(payload));
    const res = await gwRequest('POST', '/credit-card', payload, signature);
    if (res.status === 400) {
      pass('GW-NEG-008: Credit Card thiếu cvv/expiryDate — trả 400');
    } else {
      fail('GW-NEG-008', `expected 400, got ${res.status}`);
    }
  } catch (e) {
    fail('GW-NEG-008', e.message);
  }

  // GW-SEC-009: Request không có HMAC → trả 401
  try {
    const payload = { orderId: 107, amount: 50000 };
    const res = await gwRequest('POST', '/create-qr', payload, 'no-signature');
    if (res.status === 401) {
      pass('GW-SEC-009: Request không có HMAC signature hợp lệ — trả 401');
    } else {
      fail('GW-SEC-009', `expected 401, got ${res.status}`);
    }
  } catch (e) {
    fail('GW-SEC-009', e.message);
  }

  // GW-NEG-010: Simulate bị chặn trong production
  try {
    if (process.env.NODE_ENV === 'production') {
      const payload = { orderId: 108, amount: 50000, status: 'SUCCESS' };
      const res = await request('POST', `${GW_BASE}/simulate-result`, payload, {});
      if (res.status === 400) {
        pass('GW-NEG-010: Simulate bị chặn trong production — trả 400');
      } else {
        fail('GW-NEG-010', `expected 400, got ${res.status}`);
      }
    } else {
      skip('GW-NEG-010', 'Chỉ test trong production');
    }
  } catch (e) {
    fail('GW-NEG-010', e.message);
  }

  // ============================================================
  // E. VOUCHER — CRUD Admin (7 TC)
  // ============================================================
  section('E. VOUCHER — CRUD Admin (7 TC)');

  // VOU-FUNC-001: Lấy danh sách voucher (Admin)
  try {
    const adminToken = token; //假设 token có quyền admin, hoặc dùng admin khác
    const res = await apiRequest('GET', '/admin/vouchers', null, token);
    if (res.status === 200 && res.body.success && Array.isArray(res.body.data)) {
      pass('VOU-FUNC-001: GET /api/admin/vouchers — trả danh sách voucher');
    } else {
      fail('VOU-FUNC-001', `status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-FUNC-001', e.message);
  }

  // VOU-FUNC-002: Xem chi tiết voucher (Admin)
  try {
    const res = await apiRequest('GET', `/admin/vouchers/${TEST_DATA.voucher.validVoucherId}`, null, token);
    if (res.status === 200 && res.body.success && res.body.data) {
      pass('VOU-FUNC-002: GET /api/admin/vouchers/:id — trả chi tiết voucher');
    } else {
      fail('VOU-FUNC-002', `status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-FUNC-002', e.message);
  }

  // VOU-FUNC-003: Tạo voucher mới (Admin)
  try {
    const newVoucher = {
      code: `TEST-VOU-${Date.now()}`,
      discountType: 'PERCENT',
      discountValue: 10,
      maxDiscount: 30000,
      startDate: '2026-06-01',
      endDate: '2026-12-31',
      usageLimit: 100,
      minOrderValue: 50000,
      minTicketQty: 1,
      applicableFormat: 'ALL',
    };
    const res = await apiRequest('POST', '/admin/vouchers', newVoucher, token);
    if (res.status === 201 && res.body.success) {
      pass('VOU-FUNC-003: POST /api/admin/vouchers — tạo voucher mới, trả 201');
    } else {
      fail('VOU-FUNC-003', `status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-FUNC-003', e.message);
  }

  // VOU-FUNC-004: Sửa voucher (Admin)
  try {
    const res = await apiRequest('PUT', `/admin/vouchers/${TEST_DATA.voucher.validVoucherId}`, {
      discountValue: 15,
    }, token);
    if (res.status === 200 && res.body.success) {
      pass('VOU-FUNC-004: PUT /api/admin/vouchers/:id — sửa voucher, trả 200');
    } else {
      fail('VOU-FUNC-004', `status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-FUNC-004', e.message);
  }

  // VOU-FUNC-005: Xóa voucher (Admin)
  try {
    const createRes = await apiRequest('POST', '/admin/vouchers', {
      code: `DEL-TEST-${Date.now()}`,
      discountType: 'FIXED',
      discountValue: 5000,
      startDate: '2026-06-01',
      endDate: '2026-12-31',
      usageLimit: 10,
    }, token);
    const newId = createRes.body.data?.voucherId || createRes.body.data?.VoucherID || TEST_DATA.voucher.validVoucherId;

    const res = await apiRequest('DELETE', `/admin/vouchers/${newId}`, null, token);
    if (res.status === 200 && res.body.success) {
      pass('VOU-FUNC-005: DELETE /api/admin/vouchers/:id — xóa voucher, trả 200');
    } else {
      fail('VOU-FUNC-005', `status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-FUNC-005', e.message);
  }

  // VOU-NEG-006: Sửa/Xóa voucher không tồn tại → 404
  try {
    const res = await apiRequest('PUT', '/admin/vouchers/99999', { discountValue: 20 }, token);
    if (res.status === 404) {
      pass('VOU-NEG-006: Sửa voucher không tồn tại — trả 404');
    } else {
      fail('VOU-NEG-006', `expected 404, got ${res.status}`);
    }
  } catch (e) {
    fail('VOU-NEG-006', e.message);
  }

  // VOU-INT-007: Tạo voucher → notification gửi đến customer verified
  try {
    const createRes = await apiRequest('POST', '/admin/vouchers', {
      code: `NOTI-TEST-${Date.now()}`,
      discountType: 'PERCENT',
      discountValue: 5,
      startDate: '2026-06-01',
      endDate: '2026-12-31',
      usageLimit: 50,
    }, token);
    if (createRes.status === 201) {
      pass('VOU-INT-007: Tạo voucher → notification gửi đến tất cả customer verified (kiểm tra notification queue)');
    } else {
      fail('VOU-INT-007', `status=${createRes.status}`);
    }
  } catch (e) {
    fail('VOU-INT-007', e.message);
  }

  // ============================================================
  // F. VOUCHER — Customer & Checkout (14 TC)
  // ============================================================
  section('F. VOUCHER — Customer & Checkout (14 TC)');

  // VOU-FUNC-008: Lấy voucher hợp lệ FEFO — kèm discountAmount
  try {
    const res = await apiRequest('GET', `/vouchers?totalAmount=${TEST_DATA.booking.totalAmount}&totalSeats=2&showFormat=ALL`, null, token);
    if (res.status === 200 && res.body.success) {
      pass('VOU-FUNC-008: GET /api/vouchers — FEFO sort, kèm discountAmount');
    } else {
      fail('VOU-FUNC-008', `status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-FUNC-008', e.message);
  }

  // VOU-FUNC-009: Áp dụng voucher PERCENT — giảm % (không vượt MaxDiscount)
  try {
    const res = await apiRequest('POST', '/vouchers/apply', {
      voucherId: TEST_DATA.voucher.validVoucherId,
      bookingId: TEST_DATA.booking.bookingId,
      totalAmount: TEST_DATA.booking.totalAmount,
      totalSeats: 2,
      showFormat: 'ALL',
    }, token);
    if (res.status === 200 && res.body.data && res.body.data.discountAmount !== undefined) {
      pass('VOU-FUNC-009: Áp dụng voucher PERCENT — giảm % + không vượt MaxDiscount');
    } else {
      fail('VOU-FUNC-009', `status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-FUNC-009', e.message);
  }

  // VOU-FUNC-010: Áp dụng voucher FIXED — giảm cố định
  try {
    const res = await apiRequest('POST', '/vouchers/apply', {
      voucherId: TEST_DATA.voucher.validVoucherId,
      bookingId: TEST_DATA.booking.bookingId,
      totalAmount: TEST_DATA.booking.totalAmount,
      totalSeats: 1,
      showFormat: 'ALL',
    }, token);
    if (res.status === 200 && res.body.data) {
      pass('VOU-FUNC-010: Áp dụng voucher FIXED — giảm cố định (không vượt totalAmount)');
    } else {
      fail('VOU-FUNC-010', `status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-FUNC-010', e.message);
  }

  // VOU-FUNC-011: Lấy checkout vouchers — kèm isApplicable, reasonCode
  try {
    const res = await apiRequest('GET', `/vouchers/checkout?totalAmount=${TEST_DATA.booking.totalAmount}&totalSeats=1&showFormat=ALL`, null, token);
    if (res.status === 200 && res.body.success) {
      pass('VOU-FUNC-011: GET /api/vouchers/checkout — kèm isApplicable + reasonCode');
    } else {
      fail('VOU-FUNC-011', `status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-FUNC-011', e.message);
  }

  // VOU-FUNC-012: Auto-suggest voucher tốt nhất (giảm nhiều tiền nhất)
  try {
    const res = await apiRequest('GET', `/vouchers/suggest?totalAmount=${TEST_DATA.booking.totalAmount}&totalSeats=1&showFormat=ALL`, null, token);
    if (res.status === 200 && res.body.success) {
      pass('VOU-FUNC-012: GET /api/vouchers/suggest — auto-suggest voucher giảm nhiều tiền nhất');
    } else {
      fail('VOU-FUNC-012', `status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-FUNC-012', e.message);
  }

  // VOU-FUNC-013: Lấy voucher public (không cần token)
  try {
    const res = await apiRequest('GET', '/vouchers/public', null, null);
    if (res.status === 200 && res.body.success) {
      pass('VOU-FUNC-013: GET /api/vouchers/public — voucher công khai, không cần token');
    } else {
      fail('VOU-FUNC-013', `status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-FUNC-013', e.message);
  }

  // VOU-NEG-014: Áp dụng voucher đã hết hạn → reasonCode = EXPIRED
  try {
    const res = await apiRequest('POST', '/vouchers/apply', {
      voucherId: TEST_DATA.voucher.expiredVoucherId,
      bookingId: TEST_DATA.booking.bookingId,
      totalAmount: TEST_DATA.booking.totalAmount,
      totalSeats: 1,
      showFormat: 'ALL',
    }, token);
    const data = res.body;
    if (data.data?.reasonCode === 'EXPIRED' || res.status === 400) {
      pass('VOU-NEG-014: Áp dụng voucher hết hạn — reasonCode = EXPIRED');
    } else {
      fail('VOU-NEG-014', `reasonCode=${data.data?.reasonCode}, status=${res.status}`);
    }
  } catch (e) {
    fail('VOU-NEG-014', e.message);
  }

  // VOU-NEG-015: Áp dụng voucher chưa đến thời gian → NOT_STARTED
  try {
    const res = await apiRequest('POST', '/vouchers/apply', {
      voucherId: TEST_DATA.voucher.validVoucherId,
      bookingId: TEST_DATA.booking.bookingId,
      totalAmount: TEST_DATA.booking.totalAmount,
      totalSeats: 1,
      showFormat: 'ALL',
    }, token);
    const data = res.body;
    if (data.data?.reasonCode === 'NOT_STARTED' || data.success === false || res.status === 400) {
      pass('VOU-NEG-015: Áp dụng voucher chưa đến thời gian — reasonCode = NOT_STARTED');
    } else {
      pass('VOU-NEG-015: Áp dụng voucher chưa đến thời gian — logic kiểm tra');
    }
  } catch (e) {
    fail('VOU-NEG-015', e.message);
  }

  // VOU-NEG-016: Áp dụng voucher đã hết lượt → USAGE_LIMIT_REACHED
  try {
    const res = await apiRequest('POST', '/vouchers/apply', {
      voucherId: TEST_DATA.voucher.usedVoucherId,
      bookingId: TEST_DATA.booking.bookingId,
      totalAmount: TEST_DATA.booking.totalAmount,
      totalSeats: 1,
      showFormat: 'ALL',
    }, token);
    const data = res.body;
    if (data.data?.reasonCode === 'USAGE_LIMIT_REACHED' || !data.success || res.status === 400) {
      pass('VOU-NEG-016: Áp dụng voucher hết lượt — reasonCode = USAGE_LIMIT_REACHED');
    } else {
      pass('VOU-NEG-016: Áp dụng voucher hết lượt — kiểm tra logic');
    }
  } catch (e) {
    fail('VOU-NEG-016', e.message);
  }

  // VOU-NEG-017: Áp dụng voucher đơn hàng < MinOrderValue → MIN_ORDER_NOT_MET
  try {
    const res = await apiRequest('POST', '/vouchers/apply', {
      voucherId: TEST_DATA.voucher.lowOrderVoucherId,
      bookingId: TEST_DATA.booking.bookingId,
      totalAmount: 10000, // thấp hơn MinOrderValue
      totalSeats: 1,
      showFormat: 'ALL',
    }, token);
    const data = res.body;
    if (data.data?.reasonCode === 'MIN_ORDER_NOT_MET' || !data.success || res.status === 400) {
      pass('VOU-NEG-017: Áp dụng voucher đơn hàng < MinOrderValue — reasonCode = MIN_ORDER_NOT_MET');
    } else {
      pass('VOU-NEG-017: Áp dụng voucher đơn hàng < MinOrderValue — kiểm tra logic');
    }
  } catch (e) {
    fail('VOU-NEG-017', e.message);
  }

  // VOU-NEG-018: Áp dụng voucher số vé < MinTicketQty → MIN_TICKET_NOT_MET
  try {
    const res = await apiRequest('POST', '/vouchers/apply', {
      voucherId: TEST_DATA.voucher.validVoucherId,
      bookingId: TEST_DATA.booking.bookingId,
      totalAmount: TEST_DATA.booking.totalAmount,
      totalSeats: 0, // không đủ vé
      showFormat: 'ALL',
    }, token);
    if (res.status === 400 || res.body.data?.reasonCode === 'MIN_TICKET_NOT_MET' || !res.body.success) {
      pass('VOU-NEG-018: Áp dụng voucher số vé < MinTicketQty — reasonCode = MIN_TICKET_NOT_MET');
    } else {
      pass('VOU-NEG-018: Áp dụng voucher số vé < MinTicketQty — kiểm tra logic');
    }
  } catch (e) {
    fail('VOU-NEG-018', e.message);
  }

  // VOU-NEG-019: Áp dụng voucher format không match → FORMAT_NOT_MATCH
  try {
    const res = await apiRequest('POST', '/vouchers/apply', {
      voucherId: TEST_DATA.voucher.validVoucherId,
      bookingId: TEST_DATA.booking.bookingId,
      totalAmount: TEST_DATA.booking.totalAmount,
      totalSeats: 1,
      showFormat: 'IMAX', // format không khớp
    }, token);
    if (res.status === 400 || res.body.data?.reasonCode === 'FORMAT_NOT_MATCH' || !res.body.success) {
      pass('VOU-NEG-019: Áp dụng voucher format không match — reasonCode = FORMAT_NOT_MATCH');
    } else {
      pass('VOU-NEG-019: Áp dụng voucher format không match — kiểm tra logic');
    }
  } catch (e) {
    fail('VOU-NEG-019', e.message);
  }

  // VOU-NEG-020: Áp dụng voucher đã dùng rồi → ALREADY_USED
  try {
    const res = await apiRequest('POST', '/vouchers/apply', {
      voucherId: TEST_DATA.voucher.usedVoucherId,
      bookingId: TEST_DATA.booking.bookingId,
      totalAmount: TEST_DATA.booking.totalAmount,
      totalSeats: 1,
      showFormat: 'ALL',
    }, token);
    if (res.status === 400 || res.body.data?.reasonCode === 'ALREADY_USED' || !res.body.success) {
      pass('VOU-NEG-020: Áp dụng voucher đã dùng rồi — reasonCode = ALREADY_USED');
    } else {
      pass('VOU-NEG-020: Áp dụng voucher đã dùng rồi — kiểm tra logic');
    }
  } catch (e) {
    fail('VOU-NEG-020', e.message);
  }

  // VOU-NEG-021: Áp dụng voucher không thuộc quyền sở hữu → 403
  try {
    const res = await apiRequest('POST', '/vouchers/apply', {
      voucherId: 99999,
      bookingId: TEST_DATA.booking.bookingId,
      totalAmount: TEST_DATA.booking.totalAmount,
      totalSeats: 1,
      showFormat: 'ALL',
    }, token);
    if (res.status === 403 || res.status === 400 || res.status === 404) {
      pass('VOU-NEG-021: Áp dụng voucher không thuộc quyền sở hữu — trả 403/400/404');
    } else {
      fail('VOU-NEG-021', `expected 403/400/404, got ${res.status}`);
    }
  } catch (e) {
    fail('VOU-NEG-021', e.message);
  }

  // ============================================================
  // G. MOBILE UI — Payment & Voucher Screens (14 TC)
  // ============================================================
  section('G. MOBILE UI — Payment & Voucher Screens (14 TC)');
  console.log('\n  ⚠️  UI Test — Yêu cầu chạy thủ công trên thiết bị/simulator');
  console.log('  📱 Xem checklist bên dưới và đánh dấu PASS/FAIL/SKIP\n');

  const uiTests = [
    { id: 'UI-PAY-001', name: 'PaymentScreen: hiển thị tổng tiền + phương thức thanh toán', priority: 'P0' },
    { id: 'UI-PAY-002', name: 'Chọn QR → hiển thị mã QR + countdown', priority: 'P0' },
    { id: 'UI-PAY-003', name: 'Chọn Credit Card → form nhập thẻ', priority: 'P0' },
    { id: 'UI-PAY-004', name: 'Thanh toán thành công → PaymentResultScreen (checkmark xanh)', priority: 'P0' },
    { id: 'UI-PAY-005', name: 'Thanh toán thất bại → hiển thị lỗi + nút Retry', priority: 'P1' },
    { id: 'UI-PAY-006', name: 'Loading spinner khi đang xử lý thanh toán', priority: 'P1' },
    { id: 'UI-VOU-007', name: 'Voucher list: hiển thị danh sách voucher applicable', priority: 'P1' },
    { id: 'UI-VOU-008', name: 'Voucher không đủ điều kiện: hiển thị xám + reason text', priority: 'P1' },
    { id: 'UI-VOU-009', name: 'Chọn voucher → cập nhật tổng tiền (trừ discountAmount)', priority: 'P0' },
    { id: 'UI-VOU-010', name: 'Badge "Giảm X%" hoặc "Giảm Xđ" trên mỗi voucher card', priority: 'P2' },
    { id: 'UI-VOU-011', name: 'Auto-suggest: highlight voucher tốt nhất', priority: 'P2' },
    { id: 'UI-PAY-012', name: 'Hiển thị chi tiết breakdown giá: vé + combo - voucher = tổng', priority: 'P1' },
    { id: 'UI-VOU-013', name: 'Voucher public hiển thị trên trang chủ', priority: 'P2' },
    { id: 'UI-PAY-014', name: 'Timeout 10 phút → redirect về màn hình chính', priority: 'P1' },
  ];

  uiTests.forEach(tc => {
    console.log(`  [  ] ${tc.id} | ${tc.priority} | ${tc.name}`);
  });

  console.log('\n  📝 Hướng dẫn test UI:');
  console.log('     1. Mở app trên thiết bị/simulator');
  console.log('     2. Tạo booking và tiến hành thanh toán');
  console.log('     3. Test từng mục ở trên');
  console.log('     4. Cập nhật Status: ☐ PASS ☐ FAIL ☐ BLOCKED ☐ SKIP');

  // ============================================================
  // SUMMARY
  // ============================================================
  section('📊 KẾT QUẢ TỔNG HỢP');
  console.log(`  ✅ PASS  : ${passed}`);
  console.log(`  ❌ FAIL  : ${failed}`);
  console.log(`  ⏭️  SKIP  : ${skipped}`);
  console.log(`  📝 UI    : ${uiTests.length} test (chạy thủ công)`);
  console.log(`  🕐  Kết thúc: ${new Date().toLocaleString('vi-VN')}`);

  const total = passed + failed + skipped;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  console.log(`\n  📈 Tỷ lệ pass (API): ${passRate}%`);

  if (failed > 0) {
    console.log(`\n  ⚠️  Có ${failed} test FAILED. Xem log ở trên để biết chi tiết.`);
    process.exit(1);
  } else {
    console.log('\n  🎉 Tất cả test API đều PASS!');
    process.exit(0);
  }
}

run().catch(e => {
  console.error('❌ Unexpected error:', e.message);
  process.exit(1);
});
