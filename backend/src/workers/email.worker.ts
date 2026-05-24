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
 * BullMQ Email Worker — xử lý hàng đợi gửi email bất đồng bộ.
 * Mỗi loại job tương ứng với một phương thức trong EmailService.
 */
export const emailWorker = new Worker<EmailJobData>(
  'email-queue',
  async (job: Job<EmailJobData>) => {
    const { type, email } = job.data;

    switch (type) {
      case 'REGISTER_OTP':
        await EmailService.sendOtpEmail(email, job.data.otp);
        break;

      case 'RESET_PASSWORD_OTP':
        await EmailService.sendResetPasswordOtpEmail(email, job.data.otp);
        break;

      case 'WELCOME':
        await EmailService.sendWelcomeEmail(email, job.data.fullName);
        break;

      default:
        throw new Error(`[EmailWorker] Loại job không xác định: ${(job.data as any)?.type}`);
    }
  },
  {
    connection: connectionOptions,
    concurrency: Number(process.env.EMAIL_QUEUE_CONCURRENCY) || 2,
  }
);

emailWorker.on('completed', (job: Job<EmailJobData>) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[EmailWorker] Job ${job.id} (${job.data.type}) → ${job.data.email} — thành công`);
  }
});

emailWorker.on('failed', (job: Job<EmailJobData> | undefined, err: Error) => {
  console.error(
    `[EmailWorker] Job ${job?.id ?? 'unknown'} (${job?.data?.type ?? '?'}) thất bại: ${err.message}`
  );
});

