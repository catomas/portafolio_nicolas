import { useSiteData } from '../contexts/SiteDataContext';
import ContactForm from './ContactForm';

export default function ContactSection() {
  const { contact } = useSiteData();
  const title = contact.title || 'Contacto';
  const subtitle = contact.subtitle;

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
