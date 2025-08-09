import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import slackRoutes from './routes/slackRoutes';
import { connectDb } from './models/db';
import https from 'https';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.use('/api/slack', slackRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '../cert.key')),
  cert: fs.readFileSync(path.join(__dirname, '../cert.crt')),
};

connectDb()
  .then(() => {
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`HTTPS Server running on https://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });
