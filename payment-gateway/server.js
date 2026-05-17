const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./src/config');
const errorHandler = require('./src/middlewares/errorHandler');
const paymentRoutes = require('./src/routes/payment.routes');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());

// Giữ lại raw body để verify HMAC chuẩn xác
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Routes
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Payment Gateway is running' });
});

// Error handling middleware (đặt cuối cùng)
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Payment Gateway Service is running on port ${PORT} in ${config.env} mode`);
});
