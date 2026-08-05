import { useState } from 'react';
import { siteData } from '../data/siteData';
import SocialLinks from './SocialLinks';

export default function AboutSection() {
  const { bio, photographerPhotoUrl, socialLinks } = siteData.about;
  const hasBio = bio !== undefined && bio.length > 0;
  const displayBio = hasBio ? bio.slice(0, 500) : '';

  const hasPhotoUrl =
    photographerPhotoUrl !== undefined && photographerPhotoUrl.length > 0;
  const [showPhoto, setShowPhoto] = useState(hasPhotoUrl);

  const showImage = hasPhotoUrl && showPhoto;

  return (
    <section id="about" className="px-6 py-16 md:py-24 max-w-3xl mx-auto">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-8">
        About
      </h2>

      <div className={showImage ? 'md:flex md:gap-8' : ''}>
        {showImage && (
          <div className="shrink-0 mb-6 md:mb-0">
            <img
              src={photographerPhotoUrl}
              alt="Fotógrafo"
              className="max-w-75 w-full object-contain rounded-lg"
              onError={() => setShowPhoto(false)}
            />
          </div>
        )}

        <div className={showImage ? '' : 'text-center'}>
          {hasBio && (
            <p className="font-body text-text-primary/80 text-lg leading-relaxed mb-8">
              {displayBio}
            </p>
          )}

          <SocialLinks socialLinks={socialLinks} />
        </div>
      </div>
    </section>
  );
}
