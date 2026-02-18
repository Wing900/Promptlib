"use client";

import { motion } from "framer-motion";

interface ShelfTabsProps {
  categories: readonly string[];
  activeCategory: string;
  onChange: (category: string, index: number) => void;
}

export function ShelfTabs({ categories, activeCategory, onChange }: ShelfTabsProps) {
  return (
    <nav aria-label="Prompt categories">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-2 border-b border-stone-200 pb-3 text-xs uppercase tracking-[0.24em] text-muted">
        {categories.map((category, index) => {
          const isActive = category === activeCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category, index)}
              className={`relative pb-2 transition-colors ${
                isActive ? "text-ink" : "hover:text-ink"
              }`}
            >
              {category}
              {isActive ? (
                <motion.span
                  layoutId="active-category-indicator"
                  className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-ink"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

