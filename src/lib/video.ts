export function getEmbedVideoUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  let url = rawUrl.trim();
  if (!url) return null;

  // Extract from iframe tag if user pasted full embed snippet
  const iframeMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) {
    url = iframeMatch[1].trim();
  }

  // Preserve time/start if present
  const timeMatch = url.match(/[?&](?:t|start)=(\d+)s?/);
  const timeParam = timeMatch ? `?start=${timeMatch[1]}` : '';

  // 1. YouTube: youtu.be/<id>
  const youtuBeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch) {
    return `https://www.youtube-nocookie.com/embed/${youtuBeMatch[1]}${timeParam}`;
  }

  // YouTube: watch, embed, shorts, live, v
  const ytMatch = url.match(/(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)?youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/|v\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}${timeParam}`;
  }

  // 2. Twitch
  const parents = '&parent=localhost&parent=bracket-lac.vercel.app';
  const twitchClip = url.match(/(?:clips\.twitch\.tv\/|(?:www\.)?twitch\.tv\/[a-zA-Z0-9_]+\/clip\/)([a-zA-Z0-9_-]+)/);
  if (twitchClip) {
    return `https://clips.twitch.tv/embed?clip=${twitchClip[1]}${parents}&autoplay=false`;
  }

  const twitchVid = url.match(/(?:www\.)?twitch\.tv\/videos\/(\d+)/);
  if (twitchVid) {
    return `https://player.twitch.tv/?video=${twitchVid[1]}${parents}&autoplay=false`;
  }

  const twitchChannel = url.match(/(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (twitchChannel && !['directory', 'videos', 'p', 'downloads', 'jobs'].includes(twitchChannel[1].toLowerCase())) {
    return `https://player.twitch.tv/?channel=${twitchChannel[1]}${parents}&autoplay=false`;
  }

  // 3. Vimeo
  const vimeoMatch = url.match(/(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
}
