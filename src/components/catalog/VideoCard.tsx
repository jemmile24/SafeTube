import React, { useState } from 'react';
import { Play, Headphones, Bookmark, CheckCircle2, Clock } from 'lucide-react';
import { VideoItem } from '../../types/video';

interface VideoCardProps {
  video: VideoItem;
  onSelectVideo: (video: VideoItem) => void;
  onSelectAudioMode: (video: VideoItem) => void;
  isBookmarked: boolean;
  onToggleBookmark: (videoId: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onSelectVideo,
  onSelectAudioMode,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fallback avatar initial
  const channelInitial = video.channelTitle
    ? video.channelTitle.charAt(0).toUpperCase()
    : 'Y';

  // Primary thumbnail URL with fallback to standard hqdefault
  const thumbSrc = imageError
    ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
    : video.thumbnailHighUrl || video.thumbnailUrl;

  return (
    <div className="group flex flex-col gap-2.5 cursor-pointer select-none transition-transform duration-200">
      {/* Thumbnail Container */}
      <div
        onClick={() => onSelectVideo(video)}
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-safetube-card border border-safetube-border/50 group-hover:border-white/20 transition-all duration-300 shadow-sm"
      >
        <img
          src={thumbSrc}
          alt={video.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Shimmer placeholder before image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-safetube-border/50 animate-pulse" />
        )}

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-sm text-[11px] font-semibold text-white tracking-wide">
            {video.duration}
          </div>
        )}

        {/* Category tag on thumbnail */}
        {video.category && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/85 backdrop-blur-sm text-[10px] font-semibold text-white tracking-wide shadow-sm">
            {video.category}
          </div>
        )}

        {/* Desktop Hover overlay with quick play button */}
        <div className="hidden sm:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectVideo(video);
            }}
            className="w-11 h-11 rounded-full bg-safetube-red hover:bg-safetube-crimson text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95"
            title="Watch Video"
          >
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectAudioMode(video);
            }}
            className="w-10 h-10 rounded-full bg-black/80 hover:bg-black text-amber-400 border border-amber-400/30 flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95"
            title="Listen in Audio Mode"
          >
            <Headphones className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Details & Meta */}
      <div className="flex gap-2.5 px-0.5">
        {/* Channel Avatar */}
        <div className="shrink-0 pt-0.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-safetube-red to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {channelInitial}
          </div>
        </div>

        {/* Text info */}
        <div className="flex flex-col flex-1 min-w-0">
          <h3
            onClick={() => onSelectVideo(video)}
            className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug group-hover:text-safetube-red transition-colors"
            title={video.title}
          >
            {video.title}
          </h3>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-gray-400 truncate font-medium">
              {video.channelTitle}
            </span>
            <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
          </div>

          <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-400">
              <Clock className="w-3 h-3 text-gray-400" />
              Approved
            </span>

            {/* Mobile touch-friendly actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAudioMode(video);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-300 hover:text-amber-400 bg-white/5 hover:bg-white/10 text-[11px] font-medium transition-colors"
                title="Audio Mode"
              >
                <Headphones className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px]">Audio</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(video.id);
                }}
                className={`p-1.5 rounded-lg bg-white/5 transition-colors ${
                  isBookmarked
                    ? 'text-safetube-red bg-safetube-red/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title={isBookmarked ? 'Bookmarked' : 'Add to bookmarks'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
