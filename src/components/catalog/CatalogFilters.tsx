import React from 'react';
import { Clock, Compass, Bookmark, Film } from 'lucide-react';
import { CatalogFilter } from '../../types/video';

interface CatalogFiltersProps {
  activeFilter: CatalogFilter;
  onSelectFilter: (filter: CatalogFilter) => void;
  totalVideos: number;
  bookmarkedCount: number;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  activeFilter,
  onSelectFilter,
  totalVideos,
  bookmarkedCount,
}) => {
  const filterOptions: { id: CatalogFilter; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'all', label: 'All Approved', icon: <Compass className="w-3.5 h-3.5" />, count: totalVideos },
    { id: 'short', label: 'Short Form (< 5m)', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'long', label: 'In-Depth (> 15m)', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'bookmarked', label: 'Saved', icon: <Bookmark className="w-3.5 h-3.5" />, count: bookmarkedCount },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none">
      {filterOptions.map((opt) => {
        const isActive = activeFilter === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onSelectFilter(opt.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              isActive
                ? 'bg-safetube-red text-white shadow-md shadow-red-600/20'
                : 'bg-safetube-card hover:bg-safetube-cardHover text-gray-300 border border-safetube-border hover:border-gray-600'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
