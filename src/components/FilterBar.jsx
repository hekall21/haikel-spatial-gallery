import React from 'react';
import { Search, Sparkles, Image, Video, Flame, Film, X } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export function FilterBar({ 
  categories, 
  activeCategory, 
  setActiveCategory, 
  searchQuery, 
  setSearchQuery,
  sortBy,
  setSortBy,
  filteredCount
}) {
  const handleCategoryClick = (catId) => {
    soundEngine.playClick();
    setActiveCategory(catId);
  };

  const getCategoryIcon = (id) => {
    switch(id) {
      case 'photos': return <Image className="w-3 h-3" />;
      case 'videos': return <Video className="w-3 h-3" />;
      case 'featured': return <Sparkles className="w-3 h-3 text-amber-400" />;
      case 'edits': return <Film className="w-3 h-3 text-sky-400" />;
      default: return null;
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-2">
      
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? 'bg-neutral-100 text-neutral-950 border-white shadow-lg font-semibold scale-105'
                  : 'bg-neutral-900/70 text-neutral-400 border-white/10 hover:border-white/25 hover:text-white hover:bg-neutral-800/70'
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive ? 'bg-neutral-300 text-neutral-900' : 'bg-white/10 text-neutral-400'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Search & Sort Controls */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {/* Search Bar */}
        <div className="relative flex-1 md:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, camera, tag..."
            className="w-full bg-neutral-900/80 border border-white/10 rounded-xl pl-9 pr-7 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-sky-500/50 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => {
            soundEngine.playClick();
            setSortBy(e.target.value);
          }}
          className="bg-neutral-900/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-sky-500/50 font-sans cursor-pointer"
        >
          <option value="default">Default Order</option>
          <option value="featured">Featured First ✦</option>
          <option value="likes">Most Liked ❤️</option>
          <option value="views">Most Viewed 👁️</option>
        </select>
      </div>

    </div>
  );
}
