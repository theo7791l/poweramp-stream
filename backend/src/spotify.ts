import axios from 'axios';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

export async function getSpotifyToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  accessToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return accessToken!;
}

export async function searchSpotifyTrack(query: string) {
  const token = await getSpotifyToken();
  const res = await axios.get('https://api.spotify.com/v1/search', {
    headers: { Authorization: `Bearer ${token}` },
    params: { q: query, type: 'track', limit: 5 }
  });
  return res.data.tracks.items;
}

export async function getSpotifyPlaylist(playlistId: string) {
  const token = await getSpotifyToken();
  const res = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 50 }
  });
  return res.data.items.map((item: any) => item.track);
}

export async function getSpotifyAlbum(albumId: string) {
  const token = await getSpotifyToken();
  const res = await axios.get(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 50 }
  });
  return res.data.items;
}

export async function getSpotifyArtistTopTracks(artistId: string) {
  const token = await getSpotifyToken();
  const res = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { market: 'FR' }
  });
  return res.data.tracks;
}

export async function getTrackById(trackId: string) {
  const token = await getSpotifyToken();
  const res = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
