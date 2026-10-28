import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render } from '../../util/testHelpers';

import SectionClaimListingMaybe, {
  buildClaimListingUrl,
  isClaimableListing,
} from './SectionClaimListingMaybe';

const LISTING_ID = '6a15fda4-297c-4b61-b073-a0ec35d4775c';

const storeListing = (overrides = {}) => {
  const { publicData = {}, metadata = {}, ...attributes } = overrides;
  return {
    id: { uuid: LISTING_ID },
    type: 'listing',
    attributes: {
      title: 'Andacollo S.A',
      state: 'published',
      publicData: { listingType: 'tienda', ...publicData },
      metadata: { clientifyContactId: '144003879', geocodingOk: true, ...metadata },
      ...attributes,
    },
  };
};

describe('isClaimableListing', () => {
  it('acepta una ficha de tienda publicada, vinculada y bien geolocalizada', () => {
    expect(isClaimableListing(storeListing(), false)).toBe(true);
  });

  it('acepta fichas sin el dato geocodingOk', () => {
    expect(isClaimableListing(storeListing({ metadata: { geocodingOk: undefined } }), false)).toBe(
      true
    );
  });

  it('rechaza productos y servicios', () => {
    expect(
      isClaimableListing(storeListing({ publicData: { listingType: 'productos' } }), false)
    ).toBe(false);
    expect(
      isClaimableListing(storeListing({ publicData: { listingType: 'servicios' } }), false)
    ).toBe(false);
  });

  it('rechaza fichas sucias: sin contacto o mal geolocalizadas', () => {
    expect(isClaimableListing(storeListing({ metadata: { clientifyContactId: '' } }), false)).toBe(
      false
    );
    expect(isClaimableListing(storeListing({ metadata: { geocodingOk: false } }), false)).toBe(
      false
    );
  });

  it('rechaza fichas cerradas y fichas propias', () => {
    expect(isClaimableListing(storeListing({ state: 'closed' }), false)).toBe(false);
    expect(isClaimableListing(storeListing(), true)).toBe(false);
  });
});

describe('SectionClaimListingMaybe', () => {
  it('muestra el botón con el link al formulario de la ficha', () => {
    const { getByRole } = render(
      <SectionClaimListingMaybe listing={storeListing()} isOwnListing={false} />
    );
    const link = getByRole('link', { name: 'Reclamar esta ficha' });
    expect(link).toHaveAttribute('href', buildClaimListingUrl(LISTING_ID));
    expect(link.getAttribute('href')).toContain(`?ficha=${LISTING_ID}`);
  });

  it('no muestra nada en un producto', () => {
    const { queryByRole } = render(
      <SectionClaimListingMaybe
        listing={storeListing({ publicData: { listingType: 'productos' } })}
        isOwnListing={false}
      />
    );
    expect(queryByRole('link', { name: 'Reclamar esta ficha' })).toBeNull();
  });
});
