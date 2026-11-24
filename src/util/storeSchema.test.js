import { parseStoreAddress, formatStoreTelephone, petStoreSchemaFields } from './storeSchema';

describe('storeSchema', () => {
  it('parsea una dirección de provincia', () => {
    expect(
      parseStoreAddress('Av. Italia 5043, B1622 Benavidez, Provincia de Buenos Aires, Argentina')
    ).toEqual({
      streetAddress: 'Av. Italia 5043',
      postalCode: 'B1622',
      addressLocality: 'Benavidez',
      addressRegion: 'Buenos Aires',
      addressCountry: 'AR',
    });
  });

  it('parsea una dirección de CABA', () => {
    expect(parseStoreAddress('Av. Rivadavia 9089, C1407 CABA, Argentina')).toEqual({
      streetAddress: 'Av. Rivadavia 9089',
      postalCode: 'C1407',
      addressLocality: 'Ciudad Autónoma de Buenos Aires',
      addressRegion: 'Ciudad Autónoma de Buenos Aires',
      addressCountry: 'AR',
    });
  });

  it('parsea CABA con barrio y código largo', () => {
    const parsed = parseStoreAddress(
      'Cabildo 1234, C1426AAN Belgrano, Cdad. Autónoma de Buenos Aires, Argentina'
    );
    expect(parsed.postalCode).toBe('C1426AAN');
    expect(parsed.addressLocality).toBe('Belgrano');
    expect(parsed.addressRegion).toBe('Ciudad Autónoma de Buenos Aires');
  });

  it('devuelve null sin dirección', () => {
    expect(parseStoreAddress('')).toBeNull();
    expect(parseStoreAddress(null)).toBeNull();
  });

  it('formatea el teléfono', () => {
    expect(formatStoreTelephone('5491155556666')).toBe('+5491155556666');
    expect(formatStoreTelephone('011 5555-6666')).toBe('+541155556666');
    expect(formatStoreTelephone('')).toBeNull();
  });

  it('arma los campos del PetStore', () => {
    expect(
      petStoreSchemaFields({
        address: 'Av. Italia 5043, B1622 Benavidez, Provincia de Buenos Aires, Argentina',
        phone: '5491155556666',
      })
    ).toEqual({
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Av. Italia 5043',
        postalCode: 'B1622',
        addressLocality: 'Benavidez',
        addressRegion: 'Buenos Aires',
        addressCountry: 'AR',
      },
      telephone: '+5491155556666',
      areaServed: { '@type': 'City', name: 'Benavidez' },
    });
  });

  it('no inventa campos que faltan', () => {
    expect(petStoreSchemaFields({ address: null, phone: '' })).toEqual({});
  });
});
