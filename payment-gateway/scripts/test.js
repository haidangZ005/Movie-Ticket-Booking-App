const crypto = require('crypto');
const axios = require('axios');

// Secret Key y hệt trong file .env của Payment Gateway
const HMAC_SECRET = 'your_hmac_secret_key'; 
const url = 'http://localhost:4000/api/payment/create-qr';

async function test() {
  const payload = {
    orderId: "TEST-12345",
    amount: 50000,
    currency: "VND"
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', HMAC_SECRET).update(payloadString).digest('hex');

  console.log("Đang gửi Request tới Payment Gateway (Port 4000)...");
  console.log("Payload:", payloadString);
  console.log("Chữ ký HMAC:", signature);

  try {
    const response = await axios.post(url, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'x-hmac-signature': signature
      }
    });

    console.log("\n✅ Cổng thanh toán trả về thành công:");
    console.log(response.data);
    
    console.log("\n[!] Lưu ý: Base64 QR code đã được tạo. Bạn có thể copy chuỗi qrImage bỏ lên thanh địa chỉ trình duyệt để xem mã QR.");
  } catch (error) {
    console.error("\n❌ Lỗi:", error.response ? error.response.data : error.message);
  }
}

test();
