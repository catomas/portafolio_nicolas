import { useState } from 'react';
import { siteData } from '../data/siteData';

export default function HeroSection() {
  const [imageError, setImageError] = useState<boolean>(false);
  const { name, subtitle, backgroundUrl } = siteData.hero;

  return (
    <section
      id="hero"
      className="relative w-screen h-screen overflow-hidden"
    >
      {/* Background image or fallback */}
      {!imageError ? (
        <img
          src={backgroundUrl}
          alt=""
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0 bg-bg-secondary"
          aria-hidden="true"
        />
      )}

      {/* Dark overlay for text readability */}
      {!imageError && (
        <div
          className="absolute inset-0 bg-black/40"
          aria-hidden="true"
        />
      )}

      {/* Centered text overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-text-primary drop-shadow-lg">
          {name}
        </h1>
        <p className="mt-4 font-body text-xl md:text-2xl lg:text-3xl text-text-primary/90 drop-shadow-md">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
