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
 * Quien llega desde Google Ads ve primero el petshop más cercano.
 *
 * Al cargar la página de búsqueda desde un anuncio, pide la ubicación del navegador.
 * Si la persona la da, cambia la URL (replace, no suma un paso al "atrás") por:
 * - origin: su ubicación, para que los resultados se ordenen por distancia
 * - bounds: un recuadro de NEARBY_RADIUS_KM alrededor suyo
 * Si no la da, no cambia nada: quedan los resultados de la zona del anuncio.
 *
 * Se pregunta una sola vez por sesión. No renderiza nada.
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

    if (!isGoogleAdsVisit(search) || origin || alreadyAsked()) return;
    if (!window.navigator?.geolocation) return;

    markAsked();

    let cancelled = false;

    userLocation()
      .then(latlng => {
        if (cancelled) return;

        const { routeName, pathParams } = getSearchPageResourceLocatorStringParams(
          routeConfiguration,
          location
        );

        const queryParams = {
          ...rest,
          address: NEARBY_ADDRESS,
          origin: new LatLng(latlng.lat, latlng.lng),
          bounds: boundsAroundPoint(latlng, NEARBY_RADIUS_KM),
        };

        history.replace(
          createResourceLocatorString(routeName, routeConfiguration, pathParams, queryParams)
        );
      })
      .catch(() => {
        // Sin permiso o sin señal: quedan los resultados de la zona del anuncio.
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
