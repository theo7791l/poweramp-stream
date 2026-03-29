import { Router, Request, Response } from 'express';
import { resolveYouTubeAudioUrl } from '../youtube';
import { getTrackById } from '../spotify';
import axios from 'axios';

export const streamRouter = Router();

// Résoudre l'URL audio pour un track Spotify (retourne JSON)
streamRouter.get('/resolve/:trackId', async (req: Request, res: Response) => {
  try {
    const track = await getTrackById(req.params.trackId);
    const query = `${track.artists[0].name} ${track.name}`;
    const audioUrl = await resolveYouTubeAudioUrl(query, req.params.trackId);
    res.json({ url: audioUrl, track });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Proxy audio direct avec cache + Range support (utilisé par Poweramp)
streamRouter.get('/proxy/:trackId', async (req: Request, res: Response) => {
  try {
    const track = await getTrackById(req.params.trackId);
    const query = `${track.artists[0].name} ${track.name}`;
    const audioUrl = await resolveYouTubeAudioUrl(query, req.params.trackId);

    const range = req.headers['range'];
    const upstreamHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
    };
    if (range) upstreamHeaders['Range'] = range;

    const upstream = await axios.get(audioUrl, {
      headers: upstreamHeaders,
      responseType: 'stream',
      validateStatus: (s) => s < 500,
    });

    res.setHeader('Content-Type', upstream.headers['content-type'] || 'audio/webm');
    res.setHeader('Accept-Ranges', 'bytes');
    if (upstream.headers['content-length'])
      res.setHeader('Content-Length', upstream.headers['content-length']);
    if (upstream.headers['content-range'])
      res.setHeader('Content-Range', upstream.headers['content-range']);

    res.status(range ? 206 : 200);
    upstream.data.pipe(res);

    req.on('close', () => upstream.data.destroy());
  } catch (e: any) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

// Résolution par recherche texte libre
streamRouter.get('/query', async (req: Request, res: Response) => {
  try {
    const { q } = req.query as { q: string };
    if (!q) return res.status(400).json({ error: 'Paramètre q manquant' }) as any;
    const audioUrl = await resolveYouTubeAudioUrl(q);
    res.json({ url: audioUrl });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
