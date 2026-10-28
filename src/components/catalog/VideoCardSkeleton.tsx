import React from 'react';

export const VideoCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="relative aspect-video w-full rounded-2xl bg-safetube-border/60 overflow-hidden" />

      {/* Meta skeleton */}
      <div className="flex gap-3 px-1">
        {/* Avatar skeleton */}
        <div className="w-9 h-9 rounded-full bg-safetube-border/80 shrink-0" />

        <div className="flex flex-col gap-2 w-full">
          {/* Title line 1 */}
          <div className="h-4 bg-safetube-border/80 rounded-md w-11/12" />
          {/* Title line 2 */}
          <div className="h-4 bg-safetube-border/80 rounded-md w-3/4" />
          {/* Channel */}
          <div className="h-3 bg-safetube-border/60 rounded-md w-1/2 mt-1" />
        </div>
      </div>
    </div>
  );
};
