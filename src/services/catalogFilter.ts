import { VideoItem, CatalogFilter } from '../types/video';

export interface FilterOptions {
  searchQuery: string;
  activeFilter: CatalogFilter;
  bookmarkedIds: Set<string>;
  historyIds: string[];
}

/**
 * Strictly searches and filters only within the approved catalog.
 * Never queries external APIs for search.
 */
export function filterApprovedCatalog(
  videos: VideoItem[],
  options: FilterOptions
): VideoItem[] {
  const { searchQuery, activeFilter, bookmarkedIds } = options;
  const cleanQuery = searchQuery.trim().toLowerCase();

  return videos.filter((video) => {
    // 1. Search Query filter (matches Title, Channel Name, or Description)
    if (cleanQuery) {
      const matchTitle = video.title.toLowerCase().includes(cleanQuery);
      const matchChannel = video.channelTitle.toLowerCase().includes(cleanQuery);
      const matchDescription = (video.description || '').toLowerCase().includes(cleanQuery);

      if (!matchTitle && !matchChannel && !matchDescription) {
        return false;
      }
    }

    // 2. Active Tab filter
    if (activeFilter === 'bookmarked') {
      return bookmarkedIds.has(video.id);
    }

    if (activeFilter === 'short') {
      // Shorts or videos under 5 minutes (< 300s)
      return video.durationSeconds !== undefined && video.durationSeconds > 0 && video.durationSeconds <= 300;
    }

    if (activeFilter === 'long') {
      // Long format videos (> 15 minutes = > 900s)
      return video.durationSeconds !== undefined && video.durationSeconds >= 900;
    }

    return true;
  });
}
