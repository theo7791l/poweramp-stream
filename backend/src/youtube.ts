import { Innertube } from 'youtubei.js';

let yt: Innertube | null = null;

async function getYT(): Promise<Innertube> {
  if (!yt) yt = await Innertube.create();
  return yt;
}

export async function resolveYouTubeAudioUrl(query: string): Promise<string> {
  const youtube = await getYT();
  const results = await youtube.search(query, { type: 'video' });
  const video = results.videos[0];
  if (!video) throw new Error('No YouTube result found for: ' + query);

  const info = await youtube.getInfo(video.id);
  const format = info.chooseFormat({ type: 'audio', quality: 'best' });
  if (!format?.decipher) throw new Error('No audio format found');

  const url = format.decipher(youtube.session.player);
  return url;
}

export async function resolveYouTubeAudioUrlById(videoId: string): Promise<string> {
  const youtube = await getYT();
  const info = await youtube.getInfo(videoId);
  const format = info.chooseFormat({ type: 'audio', quality: 'best' });
  if (!format?.decipher) throw new Error('No audio format found');

  const url = format.decipher(youtube.session.player);
  return url;
}
