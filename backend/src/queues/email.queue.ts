import { Queue } from 'bullmq';
import redisClient from '../config/redis';
import { EmailJobData } from '../types/email-job.type';

/**
 * BullMQ Email Queue
 */
export const emailQueue = new Queue<EmailJobData>('email-queue', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s...
    },
    removeOnComplete: true,
    removeOnFail: 1000,
  },
});
