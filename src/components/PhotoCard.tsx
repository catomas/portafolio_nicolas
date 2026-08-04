import type { Photo } from '../data/types';

interface PhotoCardProps {
  readonly photo: Photo;
  readonly onClick: () => void;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
      aria-label={`Ver foto: ${photo.title}`}
    >
      <img
        src={photo.url}
        alt={photo.title}
        className="w-full aspect-4/3 object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      {/* Title overlay on hover */}
      <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="p-4 font-body text-sm text-text-primary">
          {photo.title}
        </span>
      </div>
    </button>
  );
}
