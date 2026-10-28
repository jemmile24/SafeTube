import React from 'react';
import {
  Compass,
  Bookmark,
  ShieldCheck,
  Info,
  Settings,
  CheckCircle2
} from 'lucide-react';
import { ViewMode } from '../../types/video';

interface SidebarProps {
  isOpen: boolean;
  activeView: ViewMode;
  onNavigateHome: () => void;
  onNavigateBookmarks: () => void;
  onOpenPolicy: () => void;
  onOpenLimitations: () => void;
  onOpenSettings: () => void;
  approvedCount: number;
  bookmarkedCount: number;
  catalogSource: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeView,
  onNavigateHome,
  onNavigateBookmarks,
  onOpenPolicy,
  onOpenLimitations,
  onOpenSettings,
  approvedCount,
  bookmarkedCount,
  catalogSource,
}) => {
  return (
    <aside
      className={`fixed md:sticky top-14 left-0 h-[calc(100vh-3.5rem)] z-30 bg-safetube-darker border-r border-safetube-border flex flex-col justify-between transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
      }`}
    >
      {/* Primary Navigation links */}
      <div className="p-3 space-y-1">
        {/* Approved Catalog (Home) */}
        <button
          onClick={onNavigateHome}
          className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-semibold transition-all ${
            activeView === 'catalog'
              ? 'bg-safetube-red text-white shadow-md shadow-red-600/20'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
          title="Approved Catalog"
        >
          <Compass className="w-5 h-5 shrink-0" />
          {isOpen && (
            <div className="flex items-center justify-between flex-1">
              <span>Catalog</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white">
                {approvedCount}
              </span>
            </div>
          )}
        </button>

        {/* Bookmarked / Saved */}
        <button
          onClick={onNavigateBookmarks}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          title="Saved Videos"
        >
          <Bookmark className="w-5 h-5 shrink-0 text-amber-400" />
          {isOpen && (
            <div className="flex items-center justify-between flex-1">
              <span>Saved</span>
              {bookmarkedCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  {bookmarkedCount}
                </span>
              )}
            </div>
          )}
        </button>

        <div className="my-3 border-t border-safetube-border/60" />

        {/* Strict Content Safety Policy */}
        <button
          onClick={onOpenPolicy}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          title="SafeTube Content Policy"
        >
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
          {isOpen && <span>Content Policy</span>}
        </button>

        {/* Audio Mode & Android Background Limitations */}
        <button
          onClick={onOpenLimitations}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          title="Audio & Platform Playback Disclosures"
        >
          <Info className="w-5 h-5 shrink-0 text-blue-400" />
          {isOpen && <span>Audio Limitations</span>}
        </button>

        {/* Developer Sheet Configuration */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          title="Google Sheets Settings"
        >
          <Settings className="w-5 h-5 shrink-0 text-purple-400" />
          {isOpen && <span>Sheet Config</span>}
        </button>
      </div>

      {/* Footer Info Box */}
      {isOpen && (
        <div className="p-4 m-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Strict Catalog Active</span>
          </div>
          <p className="text-gray-400 text-[11px] leading-relaxed">
            SafeTube only loads videos present in your approved Google Sheet. External recommendations and auto-discovery are blocked.
          </p>
          <div className="text-[10px] text-gray-500 font-mono truncate">
            Source: {catalogSource}
          </div>
        </div>
      )}
    </aside>
  );
};
