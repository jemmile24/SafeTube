import React from 'react';
import { ShieldCheck, SearchX, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
  onRefreshSheet: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  onClearSearch,
  onRefreshSheet,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-safetube-card border border-safetube-border flex items-center justify-center text-gray-400 mb-4 shadow-inner">
        <SearchX className="w-8 h-8 text-safetube-red" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">
        {searchQuery ? `No approved videos found for "${searchQuery}"` : 'No videos in approved catalog'}
      </h3>

      <p className="text-gray-400 text-sm max-w-md mb-6 leading-relaxed">
        {searchQuery
          ? 'SafeTube enforces strict content control: it searches exclusively within the videos approved in your Google Sheet, and never fetches unapproved external YouTube search results.'
          : 'Your Google Sheet appears to be empty or sync has not yet completed.'}
      </p>

      {/* Safety highlight pill */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 max-w-md mb-6">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Strict SafeTube Content Control is Active</span>
      </div>

      <div className="flex items-center gap-3">
        {searchQuery && (
          <button
            onClick={onClearSearch}
            className="px-5 py-2.5 rounded-xl bg-safetube-red hover:bg-safetube-crimson text-white text-sm font-medium transition-all shadow-md"
          >
            Clear Search
          </button>
        )}

        <button
          onClick={onRefreshSheet}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-safetube-card hover:bg-safetube-cardHover text-gray-200 border border-safetube-border text-sm font-medium transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Refresh Sheet
        </button>
      </div>
    </div>
  );
};
