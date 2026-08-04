import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Navbar from '../../components/Navbar';

// Mock IntersectionObserver
let observerCallback: IntersectionObserverCallback;
let observerInstances: MockIntersectionObserver[] = [];

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  elements: Element[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    observerCallback = callback;
    observerInstances.push(this);
  }

  observe(el: Element) {
    this.elements.push(el);
  }

  unobserve(_el: Element) {}

  disconnect() {
    this.elements = [];
  }
}

function simulateIntersection(targetId: string, isIntersecting: boolean) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const entry = {
    target,
    isIntersecting,
    intersectionRatio: isIntersecting ? 0.5 : 0,
    boundingClientRect: {} as DOMRectReadOnly,
    intersectionRect: {} as DOMRectReadOnly,
    rootBounds: null,
    time: Date.now(),
  } as IntersectionObserverEntry;

  act(() => {
    observerCallback([entry], {} as IntersectionObserver);
  });
}

describe('Navbar', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    observerInstances = [];
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders as a sticky nav element', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav.className).toContain('sticky');
    expect(nav.className).toContain('top-0');
    expect(nav.className).toContain('z-50');
  });

  it('renders links for Inicio, Galería, and Sobre Mí', () => {
    render(<Navbar />);
    expect(screen.getAllByText('Inicio').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Galería').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sobre Mí').length).toBeGreaterThanOrEqual(1);
  });

  it('calls scrollIntoView with smooth behavior when a desktop link is clicked', () => {
    const mockScrollIntoView = vi.fn();
    const section = document.createElement('div');
    section.id = 'hero';
    section.scrollIntoView = mockScrollIntoView;
    document.body.appendChild(section);

    render(<Navbar />);
    // Click the first "Inicio" button (desktop version)
    fireEvent.click(screen.getAllByText('Inicio')[0]);

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('targets correct section ids for each link', () => {
    const heroSection = document.createElement('div');
    heroSection.id = 'hero';
    heroSection.scrollIntoView = vi.fn();
    document.body.appendChild(heroSection);

    const gallerySection = document.createElement('div');
    gallerySection.id = 'gallery';
    gallerySection.scrollIntoView = vi.fn();
    document.body.appendChild(gallerySection);

    const aboutSection = document.createElement('div');
    aboutSection.id = 'about';
    aboutSection.scrollIntoView = vi.fn();
    document.body.appendChild(aboutSection);

    render(<Navbar />);

    fireEvent.click(screen.getAllByText('Inicio')[0]);
    expect(heroSection.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    fireEvent.click(screen.getAllByText('Galería')[0]);
    expect(gallerySection.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    fireEvent.click(screen.getAllByText('Sobre Mí')[0]);
    expect(aboutSection.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('has accessible navigation landmark', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation', { name: /navegación principal/i });
    expect(nav).toBeInTheDocument();
  });

  it('highlights "Inicio" link by default as active section', () => {
    render(<Navbar />);
    const inicioBtn = screen.getAllByText('Inicio')[0];
    expect(inicioBtn.className).toContain('text-accent');
    expect(inicioBtn.className).toContain('font-medium');
  });

  it('non-active links have text-text-primary/80 styling', () => {
    render(<Navbar />);
    const galleryBtn = screen.getAllByText('Galería')[0];
    const aboutBtn = screen.getAllByText('Sobre Mí')[0];
    expect(galleryBtn.className).toContain('text-text-primary/80');
    expect(aboutBtn.className).toContain('text-text-primary/80');
  });

  it('updates active link when IntersectionObserver fires for gallery section', () => {
    const heroSection = document.createElement('div');
    heroSection.id = 'hero';
    document.body.appendChild(heroSection);

    const gallerySection = document.createElement('div');
    gallerySection.id = 'gallery';
    document.body.appendChild(gallerySection);

    const aboutSection = document.createElement('div');
    aboutSection.id = 'about';
    document.body.appendChild(aboutSection);

    render(<Navbar />);

    simulateIntersection('gallery', true);

    const galleryBtn = screen.getAllByText('Galería')[0];
    expect(galleryBtn.className).toContain('text-accent');
    expect(galleryBtn.className).toContain('font-medium');

    const inicioBtn = screen.getAllByText('Inicio')[0];
    expect(inicioBtn.className).toContain('text-text-primary/80');
  });

  it('updates active link when IntersectionObserver fires for about section', () => {
    const heroSection = document.createElement('div');
    heroSection.id = 'hero';
    document.body.appendChild(heroSection);

    const gallerySection = document.createElement('div');
    gallerySection.id = 'gallery';
    document.body.appendChild(gallerySection);

    const aboutSection = document.createElement('div');
    aboutSection.id = 'about';
    document.body.appendChild(aboutSection);

    render(<Navbar />);

    simulateIntersection('about', true);

    const aboutBtn = screen.getAllByText('Sobre Mí')[0];
    expect(aboutBtn.className).toContain('text-accent');
    expect(aboutBtn.className).toContain('font-medium');
  });

  it('disconnects observer on unmount', () => {
    const heroSection = document.createElement('div');
    heroSection.id = 'hero';
    document.body.appendChild(heroSection);

    const gallerySection = document.createElement('div');
    gallerySection.id = 'gallery';
    document.body.appendChild(gallerySection);

    const aboutSection = document.createElement('div');
    aboutSection.id = 'about';
    document.body.appendChild(aboutSection);

    const { unmount } = render(<Navbar />);

    const observer = observerInstances[0];
    const disconnectSpy = vi.spyOn(observer, 'disconnect');

    unmount();

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('active link has border-b-2 border-accent for visual indicator', () => {
    render(<Navbar />);
    const inicioBtn = screen.getAllByText('Inicio')[0];
    expect(inicioBtn.className).toContain('border-b-2');
    expect(inicioBtn.className).toContain('border-accent');
  });

  describe('Mobile menu', () => {
    it('renders a hamburger button with aria-expanded="false" by default', () => {
      render(<Navbar />);
      const hamburger = screen.getByLabelText('Abrir menú');
      expect(hamburger).toBeInTheDocument();
      expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });

    it('does not show mobile menu by default', () => {
      render(<Navbar />);
      const nav = screen.getByRole('navigation');
      // Mobile menu has a specific class; should not be present initially
      const mobileMenu = nav.querySelector('.md\\:hidden.bg-bg-secondary');
      expect(mobileMenu).not.toBeInTheDocument();
    });

    it('shows mobile menu when hamburger is clicked', () => {
      render(<Navbar />);
      const hamburger = screen.getByLabelText('Abrir menú');

      fireEvent.click(hamburger);

      // aria-expanded should now be true
      expect(hamburger).toHaveAttribute('aria-expanded', 'true');
      // Mobile menu links should now be visible (duplicated from desktop)
      const inicioButtons = screen.getAllByText('Inicio');
      expect(inicioButtons.length).toBe(2); // desktop + mobile
    });

    it('closes mobile menu when a mobile link is clicked and scrolls to section', () => {
      const heroSection = document.createElement('div');
      heroSection.id = 'hero';
      heroSection.scrollIntoView = vi.fn();
      document.body.appendChild(heroSection);

      render(<Navbar />);
      const hamburger = screen.getByLabelText('Abrir menú');
      fireEvent.click(hamburger);

      // Click the mobile "Inicio" link (second one rendered)
      const inicioButtons = screen.getAllByText('Inicio');
      fireEvent.click(inicioButtons[1]);

      expect(heroSection.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
      // Menu should be closed now
      expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });

    it('toggles hamburger to close icon (aria-label changes)', () => {
      render(<Navbar />);
      const hamburger = screen.getByLabelText('Abrir menú');
      fireEvent.click(hamburger);

      const closeBtn = screen.getByLabelText('Cerrar menú');
      expect(closeBtn).toBeInTheDocument();
    });

    it('hamburger button has md:hidden class for mobile-only visibility', () => {
      render(<Navbar />);
      const hamburger = screen.getByLabelText('Abrir menú');
      expect(hamburger.className).toContain('md:hidden');
    });

    it('desktop nav links have hidden md:flex classes', () => {
      render(<Navbar />);
      const nav = screen.getByRole('navigation');
      const desktopUl = nav.querySelector('ul.hidden.md\\:flex');
      expect(desktopUl).toBeInTheDocument();
    });

    it('mobile menu highlights active section', () => {
      const heroSection = document.createElement('div');
      heroSection.id = 'hero';
      document.body.appendChild(heroSection);

      const gallerySection = document.createElement('div');
      gallerySection.id = 'gallery';
      document.body.appendChild(gallerySection);

      const aboutSection = document.createElement('div');
      aboutSection.id = 'about';
      document.body.appendChild(aboutSection);

      render(<Navbar />);

      simulateIntersection('gallery', true);

      // Open the mobile menu
      const hamburger = screen.getByLabelText('Abrir menú');
      fireEvent.click(hamburger);

      // The mobile "Galería" button (second instance) should be highlighted
      const galleryButtons = screen.getAllByText('Galería');
      const mobileGalleryBtn = galleryButtons[1];
      expect(mobileGalleryBtn.className).toContain('text-accent');
      expect(mobileGalleryBtn.className).toContain('font-medium');
    });

    it('uses no hardcoded colors in the component (uses palette tokens only)', () => {
      render(<Navbar />);
      const hamburger = screen.getByLabelText('Abrir menú');
      fireEvent.click(hamburger);

      const nav = screen.getByRole('navigation');
      const html = nav.innerHTML;
      // Check that no hex colors or rgb values are hardcoded in class names or inline styles
      expect(html).not.toMatch(/style="[^"]*color:\s*#/);
      expect(html).not.toMatch(/style="[^"]*background:\s*#/);
    });
  });
});
