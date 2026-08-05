export default function ContactForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl mx-auto space-y-6"
    >
      <div>
        <label
          htmlFor="contact-name"
          className="block font-body text-text-primary/80 text-sm mb-1"
        >
          Nombre
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          className="w-full rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="block font-body text-text-primary/80 text-sm mb-1"
        >
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block font-body text-text-primary/80 text-sm mb-1"
        >
          Mensaje
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className="w-full rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors resize-y"
          placeholder="Cuéntame sobre tu proyecto..."
        />
      </div>

      <button
        type="submit"
        className="w-full md:w-auto px-8 py-3 rounded-md bg-accent text-bg-primary font-body font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary transition-opacity"
      >
        Enviar
      </button>
    </form>
  );
}
