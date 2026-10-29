import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  onClearSearch,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-safetube-card border border-safetube-border flex items-center justify-center text-gray-400 mb-4 shadow-inner">
        <SearchX className="w-8 h-8 text-safetube-red" />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
        {searchQuery ? `No videos found for "${searchQuery}"` : 'No videos available'}
      </h3>

      <p className="text-gray-400 text-xs sm:text-sm max-w-md mb-6 leading-relaxed">
        {searchQuery
          ? 'Try searching with a different title, channel, or keyword.'
          : 'Check back later for new content.'}
      </p>

      {searchQuery && (
        <button
          onClick={onClearSearch}
          className="px-5 py-2 rounded-xl bg-safetube-red hover:bg-safetube-crimson text-white text-xs sm:text-sm font-semibold transition-all shadow-md"
        >
          Clear Search
        </button>
      )}
    </div>
  );
};
