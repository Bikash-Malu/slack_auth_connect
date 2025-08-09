import { WebClient } from '@slack/web-api';
import axios from 'axios';
import { getTokens, updateTokens } from '../models/db';
import { Tokens } from '../types';

export const initiateOAuth = () => {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;
  return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=channels:read,chat:write&redirect_uri=${redirectUri}`;
};

export const exchangeCodeForToken = async (code: string) => {
  const clientId = process.env.SLACK_CLIENT_ID || '';
  const clientSecret = process.env.SLACK_CLIENT_SECRET || '';
  const redirectUri = process.env.SLACK_REDIRECT_URI || '';

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    redirect_uri: redirectUri,
  });

  const response = await axios.post('https://slack.com/api/oauth.v2.access', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.data.ok) {
    throw new Error(`Slack OAuth Error: ${response.data.error || 'Failed to exchange code for token'}`);
  }

  return {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    expires_in: response.data.expires_in
  };
};

export const refreshAccessToken = async () => {
  const tokens = await getTokens();
  if (!tokens?.refresh_token) {
    throw new Error('No refresh token available');
  }

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID || '',
    client_secret: process.env.SLACK_CLIENT_SECRET || '',
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token || '',
  });

  const response = await axios.post('https://slack.com/api/oauth.v2.access', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.data.ok) {
    throw new Error(`Failed to refresh token: ${response.data.error || 'Unknown error'}`);
  }

  const { access_token, refresh_token, expires_in } = response.data;
  const newTokens = { access_token, refresh_token, expires_in };
  await updateTokens(newTokens);
  return newTokens as Tokens;
};

export const getChannels = async () => {
  const tokens = await getTokens();
  if (!tokens) throw new Error('Not authenticated');

  const client = new WebClient(tokens.access_token);
  try {
    const result = await client.conversations.list();
    return result.channels;
  } catch (error: any) {
    if (error.data?.error === 'token_expired') {
      const newTokens = await refreshAccessToken();
      const newClient = new WebClient(newTokens.access_token);
      const result = await newClient.conversations.list();
      return result.channels;
    }
    throw new Error('Failed to fetch channels: ' + error.message);
  }
};

export const sendMessage = async (channel: string, text: string) => {
  const tokens = await getTokens();
  if (!tokens) throw new Error('Not authenticated');

  const client = new WebClient(tokens.access_token);
  try {
    await client.chat.postMessage({ channel, text });
  } catch (error: any) {
    if (error.data?.error === 'token_expired') {
      const newTokens = await refreshAccessToken();
      const newClient = new WebClient(newTokens.access_token);
      await newClient.chat.postMessage({ channel, text });
    } else {
      throw new Error('Failed to send message: ' + error.message);
    }
  }
};