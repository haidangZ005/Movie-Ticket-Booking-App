const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./src/config');
const errorHandler = require('./src/middlewares/errorHandler');
const paymentRoutes = require('./src/routes/payment.routes');

const app = express();

app.use(helmet());
app.use(cors());

if (config.env !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Giữ lại raw body để verify HMAC
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  },
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'payment-gateway' });
});

app.use('/api/payment', paymentRoutes);

app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`[Server] Payment Gateway running on port ${PORT} (${config.env})`);
});

