import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { saveTokens, getScheduledMessages, saveScheduledMessage, deleteScheduledMessage, clearTokens } from '../models/db';
import { scheduleMessage, cancelScheduledMessage } from '../utils/scheduler';
import { 
  initiateOAuth as initOAuth, 
  exchangeCodeForToken, 
  getChannels as fetchChannels, 
  sendMessage 
} from '../services/slackService';

export const initiateOAuth = (req: Request, res: Response) => {
  try {
    const authUrl = initOAuth();
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate OAuth' });
  }
};

export const handleOAuthCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    await saveTokens(tokens);
    res.redirect('http://localhost:5173');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth failed: ' + error.message });
  }
};

export const getChannels = async (req: Request, res: Response) => {
  try {
    const channels = await fetchChannels();
    res.json(channels);
  } catch (error: any) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch channels' });
  }
};

export const sendMessageController = async (req: Request, res: Response) => {
  const { channel, text, send_at } = req.body;

  if (!channel || !text) {
    return res.status(400).json({ error: 'Channel and text are required' });
  }

  try {
    if (send_at) {
      const messageId = uuidv4();
      const scheduledMessage = { id: messageId, channel, text, send_at };
      await saveScheduledMessage(scheduledMessage);
      scheduleMessage(messageId, channel, text, new Date(send_at));
      res.json({ message: 'Message scheduled', id: messageId });
    } else {
      await sendMessage(channel, text);
      res.json({ message: 'Message sent' });
    }
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
};

export const getScheduled = async (req: Request, res: Response) => {
  try {
    const messages = await getScheduledMessages();
    res.json(messages);
  } catch (error) {
    console.error('Get scheduled messages error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled messages' });
  }
};

export const cancelScheduled = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Message ID is required' });
  }

  try {
    cancelScheduledMessage(id);
    await deleteScheduledMessage(id);
    res.json({ message: 'Message cancelled' });
  } catch (error) {
    console.error('Cancel scheduled message error:', error);
    res.status(500).json({ error: 'Failed to cancel message' });
  }
};
export const logoutController = async (req:Request, res:Response) => {
  try {
    await clearTokens(); // Deletes tokens from DB
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log out' });
  }
};