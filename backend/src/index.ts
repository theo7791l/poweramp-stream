import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spotifyRouter } from './routes/spotify';
import { streamRouter } from './routes/stream';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/spotify', spotifyRouter);
app.use('/stream', streamRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`Poweramp Stream backend running on port ${PORT}`);
});
