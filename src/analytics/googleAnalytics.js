/**
 * Eventos propios de GeoPetShop en Google Analytics 4.
 *
 * gtag.js lo carga util/includeScripts.js cuando hay REACT_APP_GOOGLE_ANALYTICS_ID.
 * Acá solo se mandan eventos de negocio que el page_view automático no cubre.
 *
 * - consulta_whatsapp: alguien toca "Consultar por WhatsApp" en una ficha. Es la conversión
 *   del sitio (no hay checkout). En GA4 está marcado como evento clave y se importa a
 *   Google Ads como conversión principal de la campaña de Búsqueda (nov 2026).
 */

const isBrowser = () => typeof window !== 'undefined';

/**
 * Manda un evento a GA4 si gtag está cargado. Nunca rompe la página.
 *
 * @param {String} eventName Nombre del evento en GA4 (snake_case)
 * @param {Object} params Parámetros opcionales del evento
 */
export const trackGa4Event = (eventName, params) => {
  if (!isBrowser() || typeof window.gtag !== 'function') {
    return;
  }
  try {
    window.gtag('event', eventName, { transport_type: 'beacon', ...(params || {}) });
  } catch (e) {
    // El tracking nunca tiene que cortar la navegación.
  }
};
