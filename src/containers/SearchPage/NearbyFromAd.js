import { useEffect } from 'react';

import { types as sdkTypes } from '../../util/sdkLoader';
import { userLocation } from '../../util/maps';
import { parse } from '../../util/urlHelpers';
import { createResourceLocatorString } from '../../util/routes';

import { getSearchPageResourceLocatorStringParams } from './SearchPage.shared';

const { LatLng, LatLngBounds } = sdkTypes;

// Radio del recuadro alrededor de la persona. Si adentro no hay nada,
// el rescate de NoSearchResultsMaybe busca los más cercanos sin límite de zona.
const NEARBY_RADIUS_KM = 30;
const ASKED_KEY = 'gps_nearby_from_ad_asked';
const NEARBY_ADDRESS = 'Cerca tuyo';

const KM_PER_DEGREE_LAT = 111.32;

// Si alguien busca sin zona y no da la ubicación, cae en AMBA (la misma zona que la
// campaña) en vez de la vista mundial.
const FALLBACK_ADDRESS = 'Buenos Aires';
const FALLBACK_BOUNDS = new LatLngBounds(new LatLng(-34.4, -58.18), new LatLng(-34.9, -58.8));

/**
 * Recuadro (bounds) de radiusKm alrededor de un punto.
 * No depende de Mapbox ni de Google Maps, así se puede usar antes de que cargue el mapa.
 */
export const boundsAroundPoint = (latlng, radiusKm) => {
  const dLat = radiusKm / KM_PER_DEGREE_LAT;
  const dLng = radiusKm / (KM_PER_DEGREE_LAT * Math.cos((latlng.lat * Math.PI) / 180));
  const round = n => Math.round(n * 100000) / 100000;

  return new LatLngBounds(
    new LatLng(round(latlng.lat + dLat), round(latlng.lng + dLng)),
    new LatLng(round(latlng.lat - dLat), round(latlng.lng - dLng))
  );
};

/**
 * Es una visita que llega desde un anuncio de Google Ads.
 * utm_source=google viene del sufijo de URL final de la campaña; gclid lo agrega el
 * etiquetado automático de Google Ads.
 */
export const isGoogleAdsVisit = search => {
  const params = parse(search || '');
  return params.utm_source === 'google' || !!params.gclid;
};

/**
 * Búsqueda sin zona: sin bounds, sin origin y sin keywords.
 * Es lo que abre "Buscar cerca tuyo" (/s) y también Tiendas y Catálogo
 * (/s?pub_categoryLevel1=...). Sin esto la página abre en vista mundial.
 */
export const isSearchWithoutZone = search => {
  const { bounds, origin, keywords } = parse(search || '');
  return !bounds && !origin && !keywords;
};

const alreadyAsked = () => {
  try {
    return window.sessionStorage.getItem(ASKED_KEY) === '1';
  } catch (e) {
    return false;
  }
};

const markAsked = () => {
  try {
    window.sessionStorage.setItem(ASKED_KEY, '1');
  } catch (e) {
    // Sin sessionStorage (modo privado en algunos navegadores): se pregunta igual.
  }
};

/**
 * Quien llega desde Google Ads, o busca sin zona ("Buscar cerca tuyo", Tiendas,
 * Catálogo), ve primero el petshop más cercano.
 *
 * Al cargar la página de búsqueda, pide la ubicación del navegador.
 * Si la persona la da, cambia la URL (replace, no suma un paso al "atrás") por:
 * - origin: su ubicación, para que los resultados se ordenen por distancia
 * - bounds: un recuadro de NEARBY_RADIUS_KM alrededor suyo
 * Si no la da: desde un anuncio no cambia nada (queda la zona del anuncio); sin zona,
 * se muestra AMBA en vez de la vista mundial.
 *
 * Desde un anuncio se pregunta una sola vez por sesión. No renderiza nada.
 *
 * @param {Object} props
 * @param {Object} props.location
 * @param {Object} props.history
 * @param {Array} props.routeConfiguration
 */
const NearbyFromAd = props => {
  const { location, history, routeConfiguration } = props;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const search = location?.search || '';
    const { origin, mapSearch, page, ...rest } = parse(search);

    // Sin zona se pregunta siempre (la persona tocó "Buscar cerca tuyo" o similar).
    // Desde un anuncio, una vez por sesión: si dijo que no, sigue con la zona del anuncio.
    const withoutZone = isSearchWithoutZone(search);
    const fromAd = isGoogleAdsVisit(search) && !origin && !alreadyAsked();
    if (!withoutZone && !fromAd) return;

    const { routeName, pathParams } = getSearchPageResourceLocatorStringParams(
      routeConfiguration,
      location
    );
    const replaceSearch = queryParams =>
      history.replace(
        createResourceLocatorString(routeName, routeConfiguration, pathParams, queryParams)
      );
    const fallbackToAmba = () => {
      if (withoutZone) {
        replaceSearch({ ...rest, address: FALLBACK_ADDRESS, bounds: FALLBACK_BOUNDS });
      }
    };

    if (!window.navigator?.geolocation) {
      fallbackToAmba();
      return;
    }

    if (fromAd) markAsked();

    let cancelled = false;

    userLocation()
      .then(latlng => {
        if (cancelled) return;

        replaceSearch({
          ...rest,
          address: NEARBY_ADDRESS,
          origin: new LatLng(latlng.lat, latlng.lng),
          bounds: boundsAroundPoint(latlng, NEARBY_RADIUS_KM),
        });
      })
      .catch(() => {
        // Sin permiso o sin señal: desde un anuncio quedan los resultados de su zona;
        // sin zona, AMBA.
        if (!cancelled) fallbackToAmba();
      });

    return () => {
      cancelled = true;
    };
    // Sólo al entrar a la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default NearbyFromAd;
