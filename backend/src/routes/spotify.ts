import { Router, Request, Response } from 'express';
import {
  searchSpotifyTrack,
  getSpotifyPlaylist,
  getSpotifyAlbum,
  getSpotifyArtistTopTracks,
  getTrackById,
} from '../spotify';

export const spotifyRouter = Router();

spotifyRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query as { q: string };
    if (!q) return res.status(400).json({ error: 'Paramètre q manquant' }) as any;
    const tracks = await searchSpotifyTrack(q);
    res.json(tracks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

spotifyRouter.get('/track/:id', async (req: Request, res: Response) => {
  try {
    const track = await getTrackById(req.params.id);
    res.json(track);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

spotifyRouter.get('/playlist/:id', async (req: Request, res: Response) => {
  try {
    const tracks = await getSpotifyPlaylist(req.params.id);
    res.json(tracks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

spotifyRouter.get('/album/:id', async (req: Request, res: Response) => {
  try {
    const tracks = await getSpotifyAlbum(req.params.id);
    res.json(tracks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

spotifyRouter.get('/artist/:id/top', async (req: Request, res: Response) => {
  try {
    const tracks = await getSpotifyArtistTopTracks(req.params.id);
    res.json(tracks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
