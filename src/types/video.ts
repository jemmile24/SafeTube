export interface VideoItem {
  id: string; // Canonical 11-character YouTube video ID
  originalUrl: string; // The URL entered in Google Sheets
  title: string;
  customTitle?: string; // Optional developer-managed title from Column B
  channelTitle: string;
  channelId?: string;
  description: string;
  category?: string; // Optional developer-managed category from Column C
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

export type CatalogFilter = string;
