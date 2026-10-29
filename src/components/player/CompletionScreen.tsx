import React from 'react';
import { RotateCcw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { VideoItem } from '../../types/video';

interface CompletionScreenProps {
  video: VideoItem;
  onReplay: () => void;
  onBackToCatalog: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  video,
  onReplay,
  onBackToCatalog,
}) => {
  return (
    <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/5">
        <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
        Playback Finished
      </h2>
      <p className="text-gray-300 text-xs sm:text-sm max-w-md mb-1 font-medium line-clamp-2 px-2">
        {video.title}
      </p>
      <p className="text-gray-400 text-xs mb-6">
        {video.channelTitle}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onReplay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-safetube-red hover:bg-safetube-crimson text-white text-xs sm:text-sm font-semibold shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Replay
        </button>

        <button
          onClick={onBackToCatalog}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/10 transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </button>
      </div>
    </div>
  );
};
