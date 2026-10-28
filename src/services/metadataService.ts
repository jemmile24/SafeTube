import { VideoItem } from '../types/video';
import { parseIsoDuration } from '../utils/duration';

const METADATA_CACHE_KEY_PREFIX = 'safetube_meta_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedEntry {
  item: VideoItem;
  cachedAt: number;
}

// In-memory cache for fast lookups
const memoryCache = new Map<string, VideoItem>();

/**
 * Retrieves cached metadata from memory or localStorage
 */
function getFromCache(videoId: string): VideoItem | null {
  if (memoryCache.has(videoId)) {
    return memoryCache.get(videoId)!;
  }

  try {
    const raw = localStorage.getItem(`${METADATA_CACHE_KEY_PREFIX}${videoId}`);
    if (!raw) return null;

    const parsed: CachedEntry = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
      memoryCache.set(videoId, parsed.item);
      return parsed.item;
    }
    // Expired
    localStorage.removeItem(`${METADATA_CACHE_KEY_PREFIX}${videoId}`);
  } catch {
    // Ignore storage parse errors
  }

  return null;
}

/**
 * Saves video item to memory and localStorage cache
 */
function saveToCache(item: VideoItem): void {
  memoryCache.set(item.id, item);
  try {
    const entry: CachedEntry = {
      item,
      cachedAt: Date.now(),
    };
    localStorage.setItem(`${METADATA_CACHE_KEY_PREFIX}${item.id}`, JSON.stringify(entry));
  } catch {
    // Ignore quota or serialization errors
  }
}

/**
 * Fetches rich metadata from YouTube Data API v3 in batches of up to 50 items.
 */
async function fetchYouTubeApiMetadata(
  videoIds: string[],
  apiKey: string
): Promise<Map<string, VideoItem>> {
  const results = new Map<string, VideoItem>();
  if (!videoIds.length || !apiKey) return results;

  // Process in chunks of 50 (YouTube Data API limit)
  const chunkSize = 50;
  for (let i = 0; i < videoIds.length; i += chunkSize) {
    const chunk = videoIds.slice(i, i + chunkSize);
    const idsParam = chunk.join(',');
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${idsParam}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`YouTube Data API returned status ${response.status}`);
        break;
      }

      const data = await response.json();
      const items = data.items || [];

      for (const item of items) {
        const id = item.id;
        const snippet = item.snippet || {};
        const contentDetails = item.contentDetails || {};
        const statistics = item.statistics || {};

        const durationInfo = parseIsoDuration(contentDetails.duration);
        const thumbs = snippet.thumbnails || {};
        const thumbUrl =
          thumbs.maxres?.url ||
          thumbs.standard?.url ||
          thumbs.high?.url ||
          thumbs.medium?.url ||
          thumbs.default?.url ||
          `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

        const videoItem: VideoItem = {
          id,
          originalUrl: `https://www.youtube.com/watch?v=${id}`,
          title: snippet.title || `Video ${id}`,
          channelTitle: snippet.channelTitle || 'YouTube Creator',
          channelId: snippet.channelId,
          description: snippet.description || '',
          thumbnailUrl: thumbUrl,
          thumbnailHighUrl: thumbs.maxres?.url || thumbs.high?.url || thumbUrl,
          duration: durationInfo ? durationInfo.formatted : undefined,
          durationSeconds: durationInfo ? durationInfo.seconds : undefined,
          publishedAt: snippet.publishedAt,
          viewCount: statistics.viewCount,
          isAvailable: true,
          metadataSource: 'youtube_api',
        };

        results.set(id, videoItem);
        saveToCache(videoItem);
      }
    } catch (err) {
      console.error('Error fetching YouTube API metadata chunk:', err);
    }
  }

  return results;
}

/**
 * Fetches compliant metadata for a single video via official YouTube oEmbed API
 * Does not require an API key and is completely authorized and public.
 */
async function fetchOEmbedMetadata(videoId: string): Promise<VideoItem> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;

  try {
    const response = await fetch(oEmbedUrl);
    if (!response.ok) {
      // 404 or 401 indicates deleted, private, or restricted video
      if (response.status === 404 || response.status === 401 || response.status === 403) {
        return createFallbackItem(videoId, false, 'Video unavailable or private');
      }
      throw new Error(`oEmbed status ${response.status}`);
    }

    const data = await response.json();

    const videoItem: VideoItem = {
      id: videoId,
      originalUrl: watchUrl,
      title: data.title || `Video ${videoId}`,
      channelTitle: data.author_name || 'YouTube Creator',
      channelId: undefined,
      description: '', // oEmbed does not provide description; leave empty rather than fabricate
      thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailHighUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: undefined, // Do not fabricate duration when unknown
      durationSeconds: undefined,
      isAvailable: true,
      metadataSource: 'oembed',
    };

    saveToCache(videoItem);
    return videoItem;
  } catch {
    // If oEmbed fails (CORS or network), use standard thumbnail fallback
    const fallbackItem = createFallbackItem(videoId, true);
    saveToCache(fallbackItem);
    return fallbackItem;
  }
}

/**
 * Creates a compliant fallback item without fabricating metadata
 */
function createFallbackItem(
  videoId: string,
  isAvailable: boolean = true,
  fallbackTitle?: string
): VideoItem {
  return {
    id: videoId,
    originalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    title: fallbackTitle || `Approved Video (${videoId})`,
    channelTitle: 'SafeTube Catalog',
    description: '',
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    thumbnailHighUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: undefined,
    durationSeconds: undefined,
    isAvailable,
    metadataSource: 'fallback',
  };
}

/**
 * Master metadata retrieval function:
 * 1. Checks memory/local cache
 * 2. Uses YouTube Data API v3 if key is provided
 * 3. Falls back gracefully to YouTube oEmbed for remaining items
 * 4. Falls back to compliant thumbnail URL if API is unreachable
 */
export async function getVideosMetadata(
  videoIds: string[],
  apiKey?: string
): Promise<VideoItem[]> {
  const missingIds: string[] = [];
  const resultsMap = new Map<string, VideoItem>();

  // Check cache first
  for (const id of videoIds) {
    const cached = getFromCache(id);
    if (cached) {
      resultsMap.set(id, cached);
    } else {
      missingIds.push(id);
    }
  }

  // If there are missing items and API key is provided, try YouTube Data API v3
  if (missingIds.length > 0 && apiKey) {
    try {
      const apiResults = await fetchYouTubeApiMetadata(missingIds, apiKey);
      apiResults.forEach((val, key) => resultsMap.set(key, val));
    } catch (err) {
      console.warn('YouTube API call failed, falling back to oEmbed:', err);
    }
  }

  // Any remaining items still missing metadata? Fetch via oEmbed in parallel
  const stillMissing = missingIds.filter((id) => !resultsMap.has(id));
  if (stillMissing.length > 0) {
    // Limit concurrency to 6 requests at once to avoid network throttling
    const concurrency = 6;
    for (let i = 0; i < stillMissing.length; i += concurrency) {
      const slice = stillMissing.slice(i, i + concurrency);
      const batchPromises = slice.map((id) => fetchOEmbedMetadata(id));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, idx) => {
        const id = slice[idx];
        if (result.status === 'fulfilled') {
          resultsMap.set(id, result.value);
        } else {
          const fallback = createFallbackItem(id, true);
          resultsMap.set(id, fallback);
        }
      });
    }
  }

  // Preserve the original order of videoIds as requested
  return videoIds
    .map((id) => resultsMap.get(id))
    .filter((item): item is VideoItem => item !== undefined);
}
