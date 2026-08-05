import { siteData } from '../data/siteData';
import ContactForm from './ContactForm';

export default function ContactSection() {
  const title = siteData.contact?.title || 'Contacto';
  const subtitle = siteData.contact?.subtitle;

  return (
    <section id="contact" className="px-6 py-16 md:py-24 max-w-3xl mx-auto">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
        {title}
      </h2>

      {subtitle && (
        <p className="font-body text-text-primary/80 text-lg mb-8">
          {subtitle}
        </p>
      )}

      {!subtitle && <div className="mb-8" />}

      <ContactForm />
    </section>
  );
}
