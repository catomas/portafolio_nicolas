import type { SocialLink } from '../data/types';

interface SocialLinksProps {
  readonly socialLinks: SocialLink[];
}

export default function SocialLinks({ socialLinks }: SocialLinksProps) {
  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-4">
      {socialLinks.map((link) => (
        <li key={link.platform}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary hover:text-accent transition-colors duration-200"
          >
            {link.platform}
          </a>
        </li>
      ))}
    </ul>
  );
}
