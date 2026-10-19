'use client';

import React from 'react';
import { getEmbedVideoUrl } from '@/lib/supabase';

interface TournamentVideoEmbedProps {
  videoUrl: string;
}

export function TournamentVideoEmbed({ videoUrl }: TournamentVideoEmbedProps) {
  if (!videoUrl || !videoUrl.trim()) return null;

  const rawUrl = videoUrl.trim();
  const embedUrl = getEmbedVideoUrl(rawUrl);

  // If even getEmbedVideoUrl couldn't find anything and rawUrl is empty
  if (!embedUrl) return null;

  const isDirectFile = /\.(mp4|webm|ogg|mov)($|\?)/i.test(embedUrl);
  const isYouTube = embedUrl.includes('youtube') || embedUrl.includes('youtu.be') || rawUrl.includes('youtube') || rawUrl.includes('youtu.be');
  const isTwitch = embedUrl.includes('twitch.tv') || rawUrl.includes('twitch.tv');
  const isVimeo = embedUrl.includes('vimeo.com') || rawUrl.includes('vimeo.com');

  const platformName = isYouTube ? 'YouTube' : isTwitch ? 'Twitch' : isVimeo ? 'Vimeo' : 'Video';
  const platformIcon = isYouTube ? '▶️' : isTwitch ? '🟣' : isVimeo ? '🎬' : '🎥';
  const platformLabel = isYouTube ? 'Stream / VOD' : isTwitch ? 'Live Stream' : isVimeo ? 'Video' : 'Player';

  let externalWatchUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  if (isYouTube) {
    const ytIdMatch = embedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (ytIdMatch) {
      externalWatchUrl = `https://www.youtube.com/watch?v=${ytIdMatch[1]}`;
    }
  }

  return (
    <div 
      className="card mb-8 card-p0 overflow-hidden" 
      style={{ 
        border: '1px solid rgba(255, 255, 255, 0.08)', 
        background: '#090D16',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Top Header Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(255, 255, 255, 0.02)',
          fontSize: '13px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <span style={{ fontSize: '15px' }}>{platformIcon}</span>
          <span style={{ color: 'var(--text-primary, #ffffff)', letterSpacing: '0.01em' }}>
            {platformName} <span style={{ color: 'var(--text-secondary, #94a3b8)', fontWeight: 400 }}>{platformLabel}</span>
          </span>
        </div>

        <a 
          href={externalWatchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: 'var(--accent-primary, #6366f1)',
            textDecoration: 'none',
            fontWeight: 500,
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.16)';
            e.currentTarget.style.color = '#818cf8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
            e.currentTarget.style.color = 'var(--accent-primary, #6366f1)';
          }}
        >
          Watch on {platformName} ↗
        </a>
      </div>

      {/* Video Viewport */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000000' }}>
        {isDirectFile ? (
          <video 
            src={embedUrl} 
            controls 
            playsInline
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        ) : (
          <iframe 
            src={embedUrl} 
            title="Tournament Video Stream"
            style={{ width: '100%', height: '100%', display: 'block', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
