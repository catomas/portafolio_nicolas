import { siteData } from '../data/siteData';
import SocialLinks from './SocialLinks';

export default function AboutSection() {
  const { bio, socialLinks } = siteData.about;
  const hasBio = bio !== undefined && bio.length > 0;
  const displayBio = hasBio ? bio.slice(0, 500) : '';

  return (
    <section id="about" className="px-6 py-16 md:py-24 max-w-3xl mx-auto">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-8">
        About
      </h2>

      {hasBio && (
        <p className="font-body text-text-primary/80 text-lg leading-relaxed mb-8">
          {displayBio}
        </p>
      )}

      <SocialLinks socialLinks={socialLinks} />
    </section>
  );
}
