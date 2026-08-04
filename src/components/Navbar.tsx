import { useState, useEffect } from 'react';

const navLinks = [
  { label: 'Inicio', targetId: 'hero' },
  { label: 'Galería', targetId: 'gallery' },
  { label: 'Sobre Mí', targetId: 'about' },
] as const;

const sectionIds = navLinks.map((link) => link.targetId);

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

export default function Navbar() {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { threshold: 0.3, rootMargin: '-10% 0px -10% 0px' }
    );

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  function handleMobileNavClick(targetId: string) {
    scrollToSection(targetId);
    setIsMenuOpen(false);
  }

  return (
    <nav
      className="sticky top-0 z-50 bg-bg-secondary/90 backdrop-blur-sm border-b border-accent/10"
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <span className="font-display text-lg font-semibold text-text-primary">
            NR
          </span>

          {/* Desktop navigation */}
          <ul className="hidden md:flex items-center gap-6">
            {navLinks.map(({ label, targetId }) => (
              <li key={targetId}>
                <button
                  type="button"
                  onClick={() => scrollToSection(targetId)}
                  className={`text-sm font-body transition-colors cursor-pointer ${
                    activeSection === targetId
                      ? 'text-accent font-medium border-b-2 border-accent pb-0.5'
                      : 'text-text-primary/80 hover:text-accent'
                  }`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 cursor-pointer"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span
              className={`block w-6 h-0.5 bg-text-primary transition-transform duration-200 ${
                isMenuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-text-primary transition-opacity duration-200 ${
                isMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-text-primary transition-transform duration-200 ${
                isMenuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-bg-secondary border-t border-accent/10">
          <ul className="flex flex-col px-4 py-2">
            {navLinks.map(({ label, targetId }) => (
              <li key={targetId}>
                <button
                  type="button"
                  onClick={() => handleMobileNavClick(targetId)}
                  className={`w-full text-left py-3 text-base font-body transition-colors cursor-pointer ${
                    activeSection === targetId
                      ? 'text-accent font-medium'
                      : 'text-text-primary/80 hover:text-accent'
                  }`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
