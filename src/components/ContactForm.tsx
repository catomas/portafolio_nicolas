import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { validateContactMessage } from '../lib/validation';

/** Tiempo máximo de espera para el envío mediante EmailJS (Req 12.5). */
const SEND_TIMEOUT_MS = 30_000;

/** Estado del envío del formulario. */
type Status = 'idle' | 'sending' | 'success' | 'error';

/**
 * ContactForm (público) — recolecta nombre, email y mensaje del Visitante y
 * los envía mediante EmailJS (Req 12).
 *
 * - Valida con `validateContactMessage` antes de enviar; si es inválido no
 *   invoca EmailJS y conserva los datos ingresados (Req 12.3).
 * - Deshabilita el botón mientras envía (Req 12.6) y aplica un timeout de 30 s
 *   con `Promise.race` (Req 12.5).
 * - En éxito muestra confirmación y limpia los campos (Req 12.4).
 * - En fallo/timeout muestra un mensaje de reintento, rehabilita el botón y
 *   conserva los datos (Req 12.5).
 */
export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [status, setStatus] = useState<Status>('idle');
  const [errorField, setErrorField] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const sending = status === 'sending';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;

    // Validación previa: si es inválida, no se invoca EmailJS (Req 12.3).
    const result = validateContactMessage(name, email, message);
    if (!result.ok) {
      setStatus('error');
      setErrorField(result.field);
      setFeedback(result.message);
      return;
    }

    setStatus('sending');
    setErrorField(null);
    setFeedback(null);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const params = {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    };

    // Timeout de 30 s mediante Promise.race (Req 12.5).
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('El envío superó el tiempo de espera.')),
        SEND_TIMEOUT_MS,
      );
    });

    try {
      await Promise.race([
        emailjs.send(serviceId, templateId, params, publicKey),
        timeout,
      ]);

      // Éxito: confirmación y limpieza de campos (Req 12.4).
      setStatus('success');
      setErrorField(null);
      setFeedback('¡Mensaje enviado! Gracias por escribir, te responderé pronto.');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      // Fallo o timeout: mensaje de reintento, rehabilita botón y conserva datos (Req 12.5).
      setStatus('error');
      setErrorField(null);
      setFeedback(
        'No se pudo enviar el mensaje. Por favor, inténtalo nuevamente.',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-xl mx-auto space-y-6">
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={sending}
          aria-invalid={errorField === 'name'}
          aria-describedby={errorField === 'name' ? 'contact-feedback' : undefined}
          className="w-full rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors disabled:opacity-60"
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={sending}
          aria-invalid={errorField === 'email'}
          aria-describedby={errorField === 'email' ? 'contact-feedback' : undefined}
          className="w-full rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors disabled:opacity-60"
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending}
          rows={5}
          aria-invalid={errorField === 'message'}
          aria-describedby={errorField === 'message' ? 'contact-feedback' : undefined}
          className="w-full rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors resize-y disabled:opacity-60"
          placeholder="Cuéntame sobre tu proyecto..."
        />
      </div>

      {feedback && (
        <p
          id="contact-feedback"
          role={status === 'error' ? 'alert' : 'status'}
          aria-live={status === 'error' ? 'assertive' : 'polite'}
          className={
            status === 'success'
              ? 'font-body text-sm text-accent'
              : 'font-body text-sm text-red-500'
          }
        >
          {feedback}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        aria-busy={sending}
        className="w-full md:w-auto px-8 py-3 rounded-md bg-accent text-bg-primary font-body font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {sending ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}
