import React from 'react';
import {
  Compass,
  Bookmark,
  Headphones
} from 'lucide-react';
import { ViewMode } from '../../types/video';

interface SidebarProps {
  isOpen: boolean;
  activeView: ViewMode;
  onNavigateHome: () => void;
  onNavigateAudio: () => void;
  onNavigateBookmarks: () => void;
  totalCount: number;
  bookmarkedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeView,
  onNavigateHome,
  onNavigateAudio,
  onNavigateBookmarks,
  totalCount,
  bookmarkedCount,
}) => {
  return (
    <aside
      className={`fixed md:sticky top-14 left-0 h-[calc(100vh-3.5rem)] z-30 bg-safetube-darker border-r border-safetube-border flex flex-col justify-between transition-all duration-300 ease-in-out ${
        isOpen ? 'w-60 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
      }`}
    >
      {/* Primary Navigation links */}
      <div className="p-3 space-y-1">
        {/* Library */}
        <button
          onClick={onNavigateHome}
          className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-semibold transition-all ${
            activeView === 'catalog'
              ? 'bg-safetube-red text-white shadow-md shadow-red-600/20'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
          title="Video Library"
        >
          <Compass className="w-5 h-5 shrink-0" />
          {isOpen && (
            <div className="flex items-center justify-between flex-1">
              <span>Library</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white">
                {totalCount}
              </span>
            </div>
          )}
        </button>

        {/* Audio Mode */}
        <button
          onClick={onNavigateAudio}
          className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-semibold transition-all ${
            activeView === 'audio-mode'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
          title="Audio Mode"
        >
          <Headphones className="w-5 h-5 shrink-0 text-amber-400" />
          {isOpen && <span>Audio Mode</span>}
        </button>

        {/* Bookmarked / Saved */}
        <button
          onClick={onNavigateBookmarks}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          title="Saved Videos"
        >
          <Bookmark className="w-5 h-5 shrink-0 text-safetube-red" />
          {isOpen && (
            <div className="flex items-center justify-between flex-1">
              <span>Saved</span>
              {bookmarkedCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-safetube-red/20 text-safetube-red">
                  {bookmarkedCount}
                </span>
              )}
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
