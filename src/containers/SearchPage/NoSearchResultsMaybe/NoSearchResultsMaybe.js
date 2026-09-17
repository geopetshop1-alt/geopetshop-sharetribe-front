import React, { useState } from 'react';

import { FormattedMessage } from '../../../util/reactIntl';
import { ListingCard, NamedLink } from '../../../components';
import { parse } from '../../../util/urlHelpers';
import { trackSearchNoResults } from '../../../util/api';

import css from './NoSearchResultsMaybe.module.css';

const branchLabels = {
  productos: {
    singular: 'producto',
    plural: 'productos',
    inZoneTitle: 'Otros productos en esta zona',
    nearestTitle: 'Productos más cercanos',
  },
  tienda: {
    singular: 'comercio',
    plural: 'comercios',
    inZoneTitle: 'Comercios en esta zona',
    nearestTitle: 'Comercios más cercanos',
  },
  servicios: {
    singular: 'servicio',
    plural: 'servicios',
    inZoneTitle: 'Servicios en esta zona',
    nearestTitle: 'Servicios más cercanos',
  },
};


const addressParts = address => {
  if (!address) {
    return {
      ciudad: null,
      provincia: null,
      pais: null,
      codigoPostal: null,
    };
  }

  const parts = address
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  // Ejemplo Google:
  // Av. Italia 5043
  // B1622 Benavidez
  // Provincia de Buenos Aires
  // Argentina

  const localityPart = parts.find(part =>
    /\b[A-Z]\d{4}\b/i.test(part)
  );

  const postalMatch = localityPart?.match(/\b[A-Z]\d{4}\b/i);

  const codigoPostal = postalMatch?.[0] || null;

  const ciudad = localityPart
    ? localityPart
        .replace(/\b[A-Z]\d{4}\b/i, '')
        .trim() || null
    : null;

  const provincia =
    parts.find(part => /^Provincia de /i.test(part)) || null;

  const pais =
    parts.find(part =>
      /^(Argentina|Uruguay|Chile|Brasil|Brazil)$/i.test(part)
    ) || null;

  return {
    ciudad,
    provincia,
    pais,
    codigoPostal,
  };
};

const centerFromBoundsString = bounds => {
  if (!bounds || typeof bounds !== 'string') return null;

  const values = bounds.split(',').map(Number);

  if (values.length !== 4 || values.some(Number.isNaN)) {
    return null;
  }

  const [neLat, neLng, swLat, swLng] = values;

  return {
    lat: (neLat + swLat) / 2,
    lng: (neLng + swLng) / 2,
  };
};

const rescueListingZone = listing => {
  const publicData = listing?.attributes?.publicData || {};

  return (
    publicData.ciudad ||
    publicData.city ||
    publicData.localidad ||
    publicData.zone ||
    publicData.zona ||
    publicData.location?.address ||
    publicData.address ||
    null
  );
};

const RescueCards = ({
  listings = [],
  distances = {},
  total = 0,
  branch,
  isNearest = false,
  onViewAll,
  hideTitle = false,
}) => {
  if (!listings.length) return null;

  const labels = branchLabels[branch] || branchLabels.tienda;

  return (
    <section className={css.rescueSection}>
      <div className={css.sectionHeader}>
        <div>
          {!hideTitle ? (
            <h3 className={css.sectionTitle}>
              {isNearest ? labels.nearestTitle : labels.inZoneTitle}
            </h3>
          ) : null}

          {isNearest ? (
            <p className={css.sectionDescription}>
              Estas son las opciones más próximas a la zona que buscaste.
            </p>
          ) : total > 4 ? (
            <p className={css.sectionDescription}>
              Hay {total} {labels.plural} en esta zona.
            </p>
          ) : null}
        </div>

        {!isNearest && total > 4 && onViewAll ? (
          <button
            type="button"
            className={css.viewAllButton}
            onClick={() => onViewAll(branch)}
          >
            Ver todos
          </button>
        ) : null}
      </div>

      <div className={css.cards}>
        {listings.map(listing => {
          const id = listing?.id?.uuid;
          const distance = distances?.[id];

          return (
            <div key={id} className={css.cardWrapper}>
              <ListingCard
                className={css.listingCard}
                listing={listing}
                renderSizes="(max-width: 767px) 80vw, 240px"
              />

              {typeof distance === 'number' ? (
                <div className={css.distance}>
                  {distance < 10 ? distance.toFixed(1) : Math.round(distance)} km
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};

const NoSearchResultsMaybe = props => {
  const {
    listingsAreLoaded,
    totalItems,
    location,
    resetAll,
    showCreateListingsLink,
    currentUser,
    noResultsRescue,
    primaryListings = [],
    secondaryListings = [],
    nearestPrimaryListings = [],
    nearestSecondaryListings = [],
    onViewAllRescueBranch,
  } = props;

  const [openForm, setOpenForm] = useState(null);
  const [email, setEmail] = useState('');
  const [commerceName, setCommerceName] = useState('');
  const [commercePhone, setCommercePhone] = useState('');
  const [commerceEmail, setCommerceEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedAction, setSubmittedAction] = useState(null);

  const hasNoResult = listingsAreLoaded && totalItems === 0;

  if (!hasNoResult) {
    return null;
  }

  const { address } = parse(location.search || '');
  const rescue = noResultsRescue || {};
  const primary = rescue.primary || {};
  const secondary = rescue.secondary || {};

  const rescueReady = !rescue.inProgress && rescue.branch;

  const searchQuery = parse(location.search || '');
  const accountEmail = currentUser?.attributes?.email || null;
  const userId = currentUser?.id?.uuid || null;

  const nearestShown = [
    ...nearestPrimaryListings.map(listing => ({
      listingId: listing?.id?.uuid,
      listingName: listing?.attributes?.title || null,
      listingZone: rescueListingZone(listing),
      branch: primary.branch,
      distanceKm: primary.nearestDistances?.[listing?.id?.uuid] ?? null,
    })),
    ...nearestSecondaryListings.map(listing => ({
      listingId: listing?.id?.uuid,
      listingName: listing?.attributes?.title || null,
      listingZone: rescueListingZone(listing),
      branch: secondary.branch,
      distanceKm: secondary.nearestDistances?.[listing?.id?.uuid] ?? null,
    })),
  ];

  const nearestStore =
    nearestShown
      .filter(item => item.branch === 'tienda' && typeof item.distanceKm === 'number')
      .sort((a, b) => a.distanceKm - b.distanceKm)[0] || null;

  const parsedAddress = addressParts(searchQuery.address);
  const boundsCenter = centerFromBoundsString(searchQuery.bounds);

  const basePayload = {
    caso: rescue.storesInZoneTotal > 0 ? 1 : 2,
    categoria: rescue.branch || null,

    zonaOriginal:
      parsedAddress.ciudad ||
      searchQuery.address ||
      null,

    direccionTexto: searchQuery.address || null,

    ciudad: parsedAddress.ciudad,
    provincia: parsedAddress.provincia,
    pais: parsedAddress.pais,
    codigoPostal: parsedAddress.codigoPostal,

    lat: boundsCenter?.lat ?? null,
    lng: boundsCenter?.lng ?? null,

    termino:
      searchQuery.keywords ||
      searchQuery.keyword ||
      null,

    filtros: searchQuery,

    cantidadComerciosZona: rescue.storesInZoneTotal ?? null,

    comercioCercanoListingId: nearestStore?.listingId || null,
    comercioCercanoNombre: nearestStore?.listingName || null,
    comercioCercanoZona: nearestStore?.listingZone || null,
    distanciaCercanoKm: nearestStore?.distanceKm ?? null,

    userId,

    path: `${location.pathname || ''}${location.search || ''}`,

    metadata: {
      nearestShown,
    },
  };

  const submitCoverageAlert = async event => {
    event.preventDefault();

    const finalEmail = accountEmail || email.trim();

    if (!finalEmail) {
      setSubmitError('Ingresá tu email para que podamos avisarte.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      await trackSearchNoResults({
        ...basePayload,
        accion: 'aviso_cobertura',
        email: finalEmail,
      });

      setSubmittedAction('aviso_cobertura');
      setOpenForm(null);
    } catch (error) {
      console.error('Coverage alert failed:', error);
      setSubmitError('No pudimos guardar el aviso. Probá nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitCommerceSuggestion = async event => {
    event.preventDefault();

    const name = commerceName.trim();

    if (!name) {
      setSubmitError('Ingresá el nombre del comercio.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      await trackSearchNoResults({
        ...basePayload,
        accion: 'comercio_sugerido',
        email: accountEmail || commerceEmail.trim() || null,
        comercioSugeridoNombre: name,
        comercioSugeridoTelefono: commercePhone.trim() || null,
      });

      setSubmittedAction('comercio_sugerido');
      setOpenForm(null);
    } catch (error) {
      console.error('Commerce suggestion failed:', error);
      setSubmitError('No pudimos guardar el comercio. Probá nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Mientras la consulta auxiliar todavía se está resolviendo,
  // mantenemos el fallback actual de Marketplace texts.
  if (!rescueReady) {
    const hasSearchParams = location.search?.length > 0;

    const createListingLinkMaybe = showCreateListingsLink ? (
      <NamedLink className={css.createListingLink} name="NewListingPage">
        <FormattedMessage id="SearchPage.createListing" />
      </NamedLink>
    ) : null;

    return (
      <div className={css.noSearchResults}>
        <FormattedMessage id="SearchPage.noResults" />
        <br />

        {hasSearchParams ? (
          <button className={css.resetAllFiltersButton} onClick={e => resetAll(e)}>
            <FormattedMessage id="SearchPage.resetAllFilters" />
          </button>
        ) : null}

        <p>{createListingLinkMaybe}</p>
      </div>
    );
  }

  const hasPrimaryInZone = primaryListings.length > 0;
  const hasSecondaryInZone = secondaryListings.length > 0;
  const hasStoresInZone = rescue.storesInZoneTotal > 0;

  const showNearestPrimary = !hasPrimaryInZone && nearestPrimaryListings.length > 0;
  const showNearestSecondary = !hasSecondaryInZone && nearestSecondaryListings.length > 0;

  return (
    <div className={css.rescueRoot}>
      <div className={css.intro}>
        <h2 className={css.mainTitle}>
          {hasStoresInZone
            ? 'No encontramos una coincidencia exacta'
            : 'Todavía no tenemos comercios en esta zona'}
        </h2>

        {hasStoresInZone ? (
          <p className={css.introText}>
            Pero hay otras opciones en esta zona que pueden servirte.
          </p>
        ) : null}
      </div>

      <RescueCards
        listings={primaryListings}
        distances={primary.distances}
        total={primary.total}
        branch={primary.branch}
        onViewAll={onViewAllRescueBranch}
      />

      {secondaryListings.length > 0 ? (
        <div className={css.complementaryBlock}>
          <h3 className={css.complementaryTitle}>
            {rescue.branch === 'productos'
              ? 'También podés buscar en estos comercios'
              : rescue.branch === 'tienda'
              ? 'También te pueden servir estos servicios'
              : 'También podés encontrar opciones en estos comercios'}
          </h3>

          <RescueCards
            listings={secondaryListings}
            distances={secondary.distances}
            total={secondary.total}
            branch={secondary.branch}
            onViewAll={onViewAllRescueBranch}
            hideTitle
          />
        </div>
      ) : null}

      {rescue.storesInZoneTotal === 0 ? (
        <section className={css.captureBlock}>
          <div className={css.captureItem}>
            {submittedAction === 'aviso_cobertura' ? (
              <div className={css.successMessage}>
                <strong>Listo.</strong>
                <span> Te escribimos cuando sumemos comercios en esta zona.</span>
              </div>
            ) : (
              <>
                <h3 className={css.captureTitle}>
                  ¿Querés que te avisemos cuando haya comercios en esta zona?
                </h3>

                <p className={css.captureText}>
                  Te escribimos cuando sumemos opciones cerca tuyo.
                </p>

                {openForm === 'aviso' ? (
                  <form className={css.captureForm} onSubmit={submitCoverageAlert}>
                    {!accountEmail ? (
                      <label className={css.field}>
                        <span>Email</span>
                        <input
                          type="email"
                          value={email}
                          onChange={event => setEmail(event.target.value)}
                          placeholder="tu@email.com"
                          required
                        />
                      </label>
                    ) : (
                      <p className={css.accountHint}>
                        Te avisaremos a {accountEmail}.
                      </p>
                    )}

                    {submitError ? (
                      <p className={css.formError}>{submitError}</p>
                    ) : null}

                    <div className={css.formActions}>
                      <button
                        type="submit"
                        className={css.primaryAction}
                        disabled={submitting}
                      >
                        {submitting ? 'Guardando…' : 'Confirmar aviso'}
                      </button>

                      <button
                        type="button"
                        className={css.cancelAction}
                        onClick={() => {
                          setOpenForm(null);
                          setSubmitError(null);
                        }}
                        disabled={submitting}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    className={css.primaryAction}
                    onClick={() => {
                      setOpenForm('aviso');
                      setSubmitError(null);
                    }}
                  >
                    Avisame cuando haya
                  </button>
                )}
              </>
            )}
          </div>

          <div className={css.captureItem}>
            {submittedAction === 'comercio_sugerido' ? (
              <div className={css.successMessage}>
                <strong>Gracias.</strong>
                <span> Lo revisamos para sumarlo a GeoPetShop.</span>
              </div>
            ) : (
              <>
                <h3 className={css.captureTitle}>
                  ¿Tenés un pet shop o conocés uno por acá?
                </h3>

                <p className={css.captureText}>
                  Pasánoslo para que podamos sumarlo a GeoPetShop.
                </p>

                {openForm === 'comercio' ? (
                  <form className={css.captureForm} onSubmit={submitCommerceSuggestion}>
                    <label className={css.field}>
                      <span>Nombre del comercio</span>
                      <input
                        type="text"
                        value={commerceName}
                        onChange={event => setCommerceName(event.target.value)}
                        required
                      />
                    </label>

                    <label className={css.field}>
                      <span>Teléfono (opcional)</span>
                      <input
                        type="tel"
                        value={commercePhone}
                        onChange={event => setCommercePhone(event.target.value)}
                      />
                    </label>

                    {!accountEmail ? (
                      <label className={css.field}>
                        <span>Tu email (opcional)</span>
                        <input
                          type="email"
                          value={commerceEmail}
                          onChange={event => setCommerceEmail(event.target.value)}
                          placeholder="tu@email.com"
                        />
                      </label>
                    ) : null}

                    {submitError ? (
                      <p className={css.formError}>{submitError}</p>
                    ) : null}

                    <div className={css.formActions}>
                      <button
                        type="submit"
                        className={css.secondaryAction}
                        disabled={submitting}
                      >
                        {submitting ? 'Guardando…' : 'Enviar comercio'}
                      </button>

                      <button
                        type="button"
                        className={css.cancelAction}
                        onClick={() => {
                          setOpenForm(null);
                          setSubmitError(null);
                        }}
                        disabled={submitting}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    className={css.secondaryAction}
                    onClick={() => {
                      setOpenForm('comercio');
                      setSubmitError(null);
                    }}
                  >
                    Sumar un comercio
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      ) : null}

      {showNearestPrimary ? (
        <RescueCards
          listings={nearestPrimaryListings}
          distances={primary.nearestDistances}
          branch={primary.branch}
          isNearest
        />
      ) : null}

      {showNearestSecondary ? (
        <RescueCards
          listings={nearestSecondaryListings}
          distances={secondary.nearestDistances}
          branch={secondary.branch}
          isNearest
        />
      ) : null}

      {!hasPrimaryInZone &&
      !hasSecondaryInZone &&
      !showNearestPrimary &&
      !showNearestSecondary ? (
        <button className={css.resetAllFiltersButton} onClick={e => resetAll(e)}>
          Ampliar la búsqueda
        </button>
      ) : null}
    </div>
  );
};

export default NoSearchResultsMaybe;
