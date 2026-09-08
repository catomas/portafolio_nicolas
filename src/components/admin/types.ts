/**
 * Contrato de props compartido entre AdminPage (tarea 16.1) y los formularios
 * del Panel_Admin (tareas 16.2–16.8).
 *
 * Cada formulario recibe `onFeedback`, un callback que reporta el resultado de
 * sus operaciones (éxito/error) al banner de feedback a nivel de AdminPage.
 * Esto desacopla los formularios del estado de feedback de la página y da a las
 * tareas 16.2–16.8 un contrato estable contra el cual implementar.
 */

/** Tipo de feedback que un formulario puede reportar al AdminPage. */
export type FeedbackKind = 'success' | 'error';

/**
 * Props compartidas por todos los formularios del Panel_Admin.
 *
 * @property onFeedback - Reporta un mensaje de éxito o error al banner de
 *   feedback de AdminPage. Los formularios deben llamarlo tras completar (o
 *   fallar) una operación (Req 5.8/5.9, 6.8/6.9, 7.6/7.7, 8.6/8.7, 9.9/9.10,
 *   10.4/10.5, 11.5/11.6).
 */
export interface AdminFormProps {
  onFeedback: (kind: FeedbackKind, message: string) => void;
}
