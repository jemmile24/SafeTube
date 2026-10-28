import React from 'react';
import { Compass, Bookmark, ShieldCheck, Settings } from 'lucide-react';
import { ViewMode } from '../../types/video';

interface MobileNavProps {
  activeView: ViewMode;
  onNavigateHome: () => void;
  onNavigateBookmarks: () => void;
  onOpenPolicy: () => void;
  onOpenSettings: () => void;
  bookmarkedCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeView,
  onNavigateHome,
  onNavigateBookmarks,
  onOpenPolicy,
  onOpenSettings,
  bookmarkedCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-safetube-darker/95 backdrop-blur-md border-t border-safetube-border px-4 py-2 flex items-center justify-around">
      <button
        onClick={onNavigateHome}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-semibold transition-all ${
          activeView === 'catalog' ? 'text-safetube-red' : 'text-gray-400 hover:text-white'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span>Library</span>
      </button>

      <button
        onClick={onNavigateBookmarks}
        className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-all"
      >
        <Bookmark className="w-5 h-5" />
        <span>Saved</span>
        {bookmarkedCount > 0 && (
          <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-safetube-red text-white text-[9px] font-bold flex items-center justify-center">
            {bookmarkedCount}
          </span>
        )}
      </button>

      <button
        onClick={onOpenPolicy}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-all"
      >
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
        <span>Policy</span>
      </button>

      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-all"
      >
        <Settings className="w-5 h-5" />
        <span>Config</span>
      </button>
    </nav>
  );
};
