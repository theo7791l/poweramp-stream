import { Router } from 'express';
import { resolveYouTubeAudioUrl } from '../youtube';
import { getTrackById } from '../spotify';
import axios from 'axios';

export const streamRouter = Router();

// Resolve audio URL for a Spotify track ID
streamRouter.get('/resolve/:trackId', async (req, res) => {
  try {
    const track = await getTrackById(req.params.trackId);
    const query = `${track.artists[0].name} ${track.name} audio`;
    const audioUrl = await resolveYouTubeAudioUrl(query);
    res.json({ url: audioUrl, track });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Proxy the audio stream (Poweramp fetches this URL directly)
streamRouter.get('/proxy/:trackId', async (req, res) => {
  try {
    const track = await getTrackById(req.params.trackId);
    const query = `${track.artists[0].name} ${track.name} audio`;
    const audioUrl = await resolveYouTubeAudioUrl(query);

    const range = req.headers.range;
    const headers: Record<string, string> = { 'User-Agent': 'Mozilla/5.0' };
    if (range) headers['Range'] = range;

    const upstream = await axios.get(audioUrl, {
      headers,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', upstream.headers['content-type'] || 'audio/webm');
    res.setHeader('Accept-Ranges', 'bytes');
    if (upstream.headers['content-length']) res.setHeader('Content-Length', upstream.headers['content-length']);
    if (upstream.headers['content-range']) res.setHeader('Content-Range', upstream.headers['content-range']);
    res.status(range ? 206 : 200);

    upstream.data.pipe(res);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Direct stream by search query (for Poweramp direct URL)
streamRouter.get('/query', async (req, res) => {
  try {
    const { q } = req.query as { q: string };
    if (!q) return res.status(400).json({ error: 'Missing query' });
    const audioUrl = await resolveYouTubeAudioUrl(q);
    res.json({ url: audioUrl });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
