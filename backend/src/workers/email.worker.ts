import { Worker, Job } from 'bullmq';
import { EmailService } from '../services/email.service';
import { EmailJobData } from '../types/email-job.type';
import dotenv from 'dotenv';

dotenv.config();

const connectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

/**
 * BullMQ Email Queue Worker
 */
export const emailWorker = new Worker<EmailJobData>(
  'email-queue',
  async (job: Job<EmailJobData>) => {
    const { email, otp, type } = job.data;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Queue Worker] Đang xử lý gửi email cho ${email}, Loại: ${type}`);
    }

    if (type === 'REGISTER_OTP') {
      await EmailService.sendOtpEmail(email, otp);
    } else if (type === 'RESET_PASSWORD_OTP') {
      await EmailService.sendResetPasswordOtpEmail(email, otp);
    } else {
      throw new Error(`Unknown job type: ${type}`);
    }
  },
  {
    connection: connectionOptions,
    concurrency: Number(process.env.EMAIL_QUEUE_CONCURRENCY) || 2,
  }
);

emailWorker.on('completed', (job: Job) => {
  if (process.env.NODE_ENV !== 'production') {
    const sanitizedData = {
      ...job.data,
      otp: '***MASKED***'
    };
    console.log(`[Queue Worker] Job ${job.id} gửi thành công:`, sanitizedData);
  }
});

emailWorker.on('failed', (job: Job | undefined, err: Error) => {
  const sanitizedData = job ? { ...job.data, otp: '***MASKED***' } : {};
  console.error(`[Queue Worker] Job ${job?.id || 'unknown'} thất bại với lỗi: ${err.message}`, sanitizedData);
});
