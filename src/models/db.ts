import mongoose from 'mongoose';
import { Tokens, ScheduledMessage } from '../types';

export const connectDb = async () => {
  const uri = 'mongodb+srv://bikashmalu220:admin@cluster0.pz3be2g.mongodb.net/slack-connect';
  try {
    await mongoose.connect(uri);
    console.log(' Connected to MongoDB with Mongoose');
  } catch (error) {
    console.error(' MongoDB connection error:', error);
    throw error;
  }
};

const tokenSchema = new mongoose.Schema<Tokens>(
  {
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true },
    expires_in: { type: Number, required: true },
  },
  { collection: 'tokens' }
);

const TokenModel = mongoose.model<Tokens>('Token', tokenSchema);

const scheduledMessageSchema = new mongoose.Schema<ScheduledMessage>(
  {
    id: { type: String, required: true },
    channel: { type: String, required: true },
    text: { type: String, required: true },
    send_at: { type: String, required: true },
  },
  { collection: 'scheduled_messages' }
);

const ScheduledMessageModel = mongoose.model<ScheduledMessage>('ScheduledMessage', scheduledMessageSchema);

export const saveTokens = async (tokens: Tokens) => {
  await TokenModel.replaceOne({}, tokens, { upsert: true });
};

export const updateTokens = async (tokens: Tokens) => {
  await TokenModel.updateOne({}, { $set: tokens }, { upsert: true });
};

export const getTokens = async (): Promise<Tokens | null> => {
  return await TokenModel.findOne({});
};

export const saveScheduledMessage = async (message: ScheduledMessage) => {
  const doc = new ScheduledMessageModel(message);
  await doc.save();
};

export const getScheduledMessages = async (): Promise<ScheduledMessage[]> => {
  return await ScheduledMessageModel.find({});
};

export const deleteScheduledMessage = async (id: string) => {
  await ScheduledMessageModel.deleteOne({ id });
};
export const clearTokens = async () => {
  await TokenModel.deleteMany({});
};

