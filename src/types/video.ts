export interface VideoItem {
  id: string; // Canonical 11-character YouTube video ID
  originalUrl: string; // The URL entered in Google Sheets
  title: string;
  channelTitle: string;
  channelId?: string;
  description: string;
  thumbnailUrl: string;
  thumbnailHighUrl?: string;
  duration?: string; // Formatted "MM:SS" or "HH:MM:SS"
  durationSeconds?: number;
  publishedAt?: string;
  viewCount?: string;
  isAvailable?: boolean;
  metadataSource: 'youtube_api' | 'oembed' | 'fallback';
  sheetRowIndex?: number;
}

export type ViewMode = 'catalog' | 'player' | 'audio-mode';

export type CatalogFilter = 'all' | 'recent' | 'short' | 'long' | 'bookmarked';
