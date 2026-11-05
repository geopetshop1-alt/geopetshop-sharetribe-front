/**
 * Píxel de Meta (Facebook) de GeoPetShop.
 *
 * Mide qué hace en el sitio la gente que llega desde los anuncios de Meta:
 * - PageView en la carga inicial y en cada navegación interna (SPA).
 * - Contact cuando alguien toca "Consultar por WhatsApp" (es la conversión del sitio,
 *   porque no hay checkout).
 *
 * El ID se puede pisar con la variable de entorno REACT_APP_META_PIXEL_ID.
 * Píxel creado en el portfolio "Geo PetShop" de Meta (nov 2026).
 *
 * Nota: si se agregan dominios nuevos, revisar server/csp.js.
 */

const DEFAULT_META_PIXEL_ID = '1114192681604441';

export const META_PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID || DEFAULT_META_PIXEL_ID;

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Carga fbevents.js y registra el PageView inicial. Solo corre en el navegador y una sola vez.
 *
 * @param {String} pixelId ID del píxel de Meta
 */
export const initMetaPixel = (pixelId = META_PIXEL_ID) => {
  if (!isBrowser() || !pixelId || window.fbq) {
    return;
  }

  // Snippet oficial de Meta, reescrito sin código inline para respetar la CSP.
  const fbq = function fbq() {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, arguments);
    } else {
      fbq.queue.push(arguments);
    }
  };
  if (!window._fbq) {
    window._fbq = fbq;
  }
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
};

/**
 * Manda un evento estándar al píxel si está cargado. Nunca rompe la página.
 *
 * @param {String} eventName Evento estándar de Meta (ej. 'Contact')
 * @param {Object} params Parámetros opcionales del evento
 */
export const trackMetaPixelEvent = (eventName, params) => {
  if (!isBrowser() || typeof window.fbq !== 'function') {
    return;
  }
  try {
    if (params) {
      window.fbq('track', eventName, params);
    } else {
      window.fbq('track', eventName);
    }
  } catch (e) {
    // El tracking nunca tiene que cortar la navegación.
  }
};

/**
 * Handler de analytics para el middleware de navegación (ver analytics.js).
 * El PageView de la carga inicial lo manda initMetaPixel; acá solo se mandan
 * las navegaciones internas.
 */
export class MetaPixelHandler {
  trackPageView(canonicalPath, previousPath) {
    if (previousPath && previousPath !== canonicalPath) {
      // Igual que GA4: se espera a que se actualice el <title>.
      window.setTimeout(() => trackMetaPixelEvent('PageView'), 300);
    }
  }
}
