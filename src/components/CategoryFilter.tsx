import type { Category } from '../data/types';

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      <button
        onClick={() => onCategoryChange('all')}
        className={`px-4 py-2 rounded-full font-body text-sm transition-colors ${
          activeCategory === 'all'
            ? 'bg-accent text-bg-primary'
            : 'bg-bg-secondary text-text-primary hover:bg-accent/20'
        }`}
        aria-pressed={activeCategory === 'all'}
      >
        Todas
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-4 py-2 rounded-full font-body text-sm transition-colors ${
            activeCategory === category.id
              ? 'bg-accent text-bg-primary'
              : 'bg-bg-secondary text-text-primary hover:bg-accent/20'
          }`}
          aria-pressed={activeCategory === category.id}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
