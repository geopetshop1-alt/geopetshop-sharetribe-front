import React from 'react';

import { LISTING_STATE_PUBLISHED } from '../../util/types';

import css from './ListingPage.module.css';

// Formulario de reclamo de ficha (flujo n8n GPS-R1). Recibe el id de la ficha
// de Sharetribe y desde ahí resuelve el contacto de Clientify.
export const CLAIM_LISTING_BASE_URL =
  'https://lautaroandacollosa.app.n8n.cloud/webhook/gps-reclamo';

export const buildClaimListingUrl = listingId =>
  `${CLAIM_LISTING_BASE_URL}?ficha=${encodeURIComponent(listingId)}`;

// El formulario se abre recién cuando una persona hace clic. Si fuera un <a href>,
// los robots que recorren el sitio (Google, SERanking, etc.) siguen el link en
// cada ficha de tienda y cada visita gasta una ejecución de n8n: el 7 y 8/11
// hubo unas 5.700. Un botón no deja el link en el HTML, así que no lo siguen.
export const openClaimListingForm = listingId => {
  if (typeof window === 'undefined') {
    return;
  }
  const opened = window.open(buildClaimListingUrl(listingId), '_blank', 'noopener,noreferrer');
  if (!opened) {
    // Si el navegador bloquea la pestaña nueva, abrir en la misma.
    window.location.assign(buildClaimListingUrl(listingId));
  }
};

/**
 * Decide si la ficha se puede reclamar desde la web.
 *
 * Solo fichas de tienda publicadas, vinculadas a un contacto de Clientify y
 * bien geolocalizadas. Las fichas sucias (sin contacto o con geocodingOk en
 * false) quedan afuera, como pide la decisión del 11/09 sobre el reclamo.
 * Si la ficha ya está reclamada, el flujo GPS-R1 lo detecta y se lo dice al
 * comercio, así que acá no hace falta saberlo.
 */
export const isClaimableListing = (listing, isOwnListing) => {
  const attributes = listing?.attributes || {};
  const publicData = attributes.publicData || {};
  const metadata = attributes.metadata || {};

  return (
    !isOwnListing &&
    !!listing?.id?.uuid &&
    attributes.state === LISTING_STATE_PUBLISHED &&
    publicData.listingType === 'tienda' &&
    !!metadata.clientifyContactId &&
    metadata.geocodingOk !== false
  );
};

/**
 * Botón "Reclamar esta ficha" para que el comercio tome control de su ficha
 * de tienda en GeoPetShop.
 *
 * @component
 * @param {Object} props
 * @param {propTypes.listing} props.listing - La ficha que se está viendo
 * @param {boolean} props.isOwnListing - Si la ficha es del usuario logueado
 * @returns {JSX.Element|null}
 */
const SectionClaimListingMaybe = props => {
  const { listing, isOwnListing } = props;

  if (!isClaimableListing(listing, isOwnListing)) {
    return null;
  }

  return (
    <section className={css.claimListingSection}>
      <p className={css.claimListingTitle}>¿Es tu comercio?</p>
      <p className={css.claimListingText}>
        Reclamá esta ficha para administrarla. Te mandamos un WhatsApp al número del comercio para
        confirmar que sos vos.
      </p>
      <button
        type="button"
        className={css.claimListingButton}
        onClick={() => openClaimListingForm(listing.id.uuid)}
      >
        Reclamar esta ficha
      </button>
    </section>
  );
};

export default SectionClaimListingMaybe;
