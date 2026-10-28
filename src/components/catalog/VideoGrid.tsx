import React from 'react';
import { VideoItem, CatalogFilter } from '../../types/video';
import { VideoCard } from './VideoCard';
import { VideoCardSkeleton } from './VideoCardSkeleton';
import { CatalogFilters } from './CatalogFilters';
import { EmptyState } from './EmptyState';

interface VideoGridProps {
  videos: VideoItem[];
  isLoading: boolean;
  searchQuery: string;
  activeFilter: CatalogFilter;
  onSelectFilter: (filter: CatalogFilter) => void;
  onClearSearch: () => void;
  onSelectVideo: (video: VideoItem) => void;
  onSelectAudioMode: (video: VideoItem) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (videoId: string) => void;
  onRefreshSheet: () => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  isLoading,
  searchQuery,
  activeFilter,
  onSelectFilter,
  onClearSearch,
  onSelectVideo,
  onSelectAudioMode,
  bookmarkedIds,
  onToggleBookmark,
  onRefreshSheet,
}) => {
  return (
    <div className="w-full">
      {/* Category / Duration Filter Bar */}
      <div className="mb-4">
        <CatalogFilters
          activeFilter={activeFilter}
          onSelectFilter={onSelectFilter}
          totalVideos={videos.length}
          bookmarkedCount={bookmarkedIds.size}
        />
      </div>

      {/* Active Search & Library Status Banner */}
      {searchQuery && (
        <div className="flex items-center justify-between p-3.5 mb-6 rounded-2xl bg-white/5 border border-white/10 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Search results for:</span>
            <span className="font-semibold text-white">"{searchQuery}"</span>
            <span className="px-2 py-0.5 rounded-full bg-safetube-red/20 text-safetube-red text-xs font-bold">
              {videos.length} found
            </span>
          </div>

          <button
            onClick={onClearSearch}
            className="text-xs font-medium text-gray-400 hover:text-white underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Video Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          onClearSearch={onClearSearch}
          onRefreshSheet={onRefreshSheet}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onSelectVideo={onSelectVideo}
              onSelectAudioMode={onSelectAudioMode}
              isBookmarked={bookmarkedIds.has(video.id)}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
};
