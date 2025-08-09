import schedule from 'node-schedule';
import { sendMessage } from '../services/slackService';
import { deleteScheduledMessage } from '../models/db';

export const scheduleMessage = (id: string, channel: string, text: string, sendAt: Date) => {
  schedule.scheduleJob(id, sendAt, async () => {
    try {
      await sendMessage(channel, text);
      await deleteScheduledMessage(id);
      console.log(`Scheduled message ${id} sent successfully`);
    } catch (error) {
      console.error('Failed to send scheduled message:', error);
      // Optionally, you could retry or mark the message as failed
    }
  });
};

export const cancelScheduledMessage = (id: string) => {
  const job = schedule.scheduledJobs[id];
  if (job) {
    job.cancel();
    console.log(`Cancelled scheduled job ${id}`);
  }
};
