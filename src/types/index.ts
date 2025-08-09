export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface ScheduledMessage {
  id: string;
  channel: string;
  text: string;
  send_at: string;
}
