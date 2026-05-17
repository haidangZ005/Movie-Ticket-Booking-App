import * as crypto from 'crypto';

const HMAC_SECRET = process.env.PAYMENT_GW_HMAC_SECRET || 'your_hmac_secret_key';

export const generateSignature = (payload: any): string => {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
};

export const verifySignature = (payload: any, signature: string): boolean => {
  const expectedSignature = generateSignature(payload);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};
