import { Router } from 'express';
import { searchSpotifyTrack, getSpotifyPlaylist, getSpotifyAlbum, getSpotifyArtistTopTracks, getTrackById } from '../spotify';

export const spotifyRouter = Router();

// Search tracks
spotifyRouter.get('/search', async (req, res) => {
  try {
    const { q } = req.query as { q: string };
    if (!q) return res.status(400).json({ error: 'Missing query' });
    const tracks = await searchSpotifyTrack(q);
    res.json(tracks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get single track
spotifyRouter.get('/track/:id', async (req, res) => {
  try {
    const track = await getTrackById(req.params.id);
    res.json(track);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get playlist tracks
spotifyRouter.get('/playlist/:id', async (req, res) => {
  try {
    const tracks = await getSpotifyPlaylist(req.params.id);
    res.json(tracks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get album tracks
spotifyRouter.get('/album/:id', async (req, res) => {
  try {
    const tracks = await getSpotifyAlbum(req.params.id);
    res.json(tracks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get artist top tracks
spotifyRouter.get('/artist/:id/top', async (req, res) => {
  try {
    const tracks = await getSpotifyArtistTopTracks(req.params.id);
    res.json(tracks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
