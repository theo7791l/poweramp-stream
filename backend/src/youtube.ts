import { Innertube } from 'youtubei.js';

let yt: Innertube | null = null;

// Cache: trackId -> { url, expiry }
const urlCache = new Map<string, { url: string; expiry: number }>();
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 heures (URLs YouTube expirent ~6h)

async function getYT(): Promise<Innertube> {
  if (!yt) yt = await Innertube.create({ retrieve_player: true });
  return yt;
}

export async function resolveYouTubeAudioUrl(query: string, cacheKey?: string): Promise<string> {
  const key = cacheKey ?? query;

  const cached = urlCache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.url;
  }

  const youtube = await getYT();
  const results = await youtube.search(query, { type: 'video' });

  const videos = results.videos;
  if (!videos || videos.length === 0) {
    throw new Error('Aucun résultat YouTube pour: ' + query);
  }

  // Prendre la première vidéo avec un id valide
  const video = videos.find((v: any) => v.id) as any;
  if (!video?.id) throw new Error('Pas de video_id valide pour: ' + query);

  const info = await youtube.getInfo(video.id);
  const format = info.chooseFormat({ type: 'audio', quality: 'best' });

  if (!format) throw new Error('Aucun format audio disponible pour: ' + video.id);

  const player = youtube.session.player;
  if (!player) throw new Error('Player YouTube non initialisé');

  const url = format.decipher(player);
  if (!url) throw new Error('Déchiffrement URL échoué pour: ' + video.id);

  urlCache.set(key, { url, expiry: Date.now() + CACHE_TTL_MS });
  return url;
}
