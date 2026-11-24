/**
 * Datos estructurados (schema.org) de las fichas de comercio de GeoPetShop.
 *
 * Arma los campos que Google pide para un PetStore / LocalBusiness con los datos que ya tiene
 * la ficha: la dirección de Google guardada en publicData.location.address y el WhatsApp.
 * No se inventa nada: si un dato falta, el campo no se incluye.
 */

const POSTAL_CODE_RE = /\b[A-Z]\d{4}[A-Z]{0,3}\b/i;
const CABA_RE = /(\bCABA\b|Aut[oó]noma de Buenos Aires|Capital Federal)/i;
const COUNTRY_RE = /^(Argentina|AR)$/i;
const CABA_NAME = 'Ciudad Autónoma de Buenos Aires';

/**
 * Separa una dirección con formato de Google en sus partes.
 * Ej: "Av. Italia 5043, B1622 Benavidez, Provincia de Buenos Aires, Argentina"
 * Ej: "Av. Rivadavia 9089, C1407 CABA, Argentina"
 *
 * @param {String} address dirección completa
 * @returns {Object|null} { streetAddress, postalCode, addressLocality, addressRegion, addressCountry }
 */
export const parseStoreAddress = address => {
  if (!address || typeof address !== 'string') {
    return null;
  }

  const parts = address
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  const hasCountry = parts.length > 1 && COUNTRY_RE.test(parts[parts.length - 1]);
  const withoutCountry = hasCountry ? parts.slice(0, -1) : parts;

  const streetAddress = withoutCountry[0];
  const rest = withoutCountry.slice(1);

  // La localidad es la parte con código postal; si no hay, la que sigue a la calle.
  const localityIndex = rest.findIndex(part => POSTAL_CODE_RE.test(part));
  const localityRaw = localityIndex >= 0 ? rest[localityIndex] : rest[0];
  const postalCode = localityRaw?.match(POSTAL_CODE_RE)?.[0]?.toUpperCase() || null;
  const localityClean = localityRaw ? localityRaw.replace(POSTAL_CODE_RE, '').trim() : '';

  const afterLocality = rest.slice((localityIndex >= 0 ? localityIndex : 0) + 1);
  const regionRaw = afterLocality.length > 0 ? afterLocality[afterLocality.length - 1] : null;

  const isCaba =
    CABA_RE.test(address) || (!!postalCode && postalCode.startsWith('C') && !regionRaw);

  const addressLocality = isCaba && CABA_RE.test(localityClean) ? CABA_NAME : localityClean || null;
  const addressRegion = isCaba
    ? CABA_NAME
    : regionRaw
    ? regionRaw.replace(/^Provincia de\s+/i, '').trim()
    : null;

  return {
    streetAddress: streetAddress || null,
    postalCode,
    addressLocality,
    addressRegion,
    addressCountry: 'AR',
  };
};

/**
 * Pasa un WhatsApp de la ficha a formato internacional (+54...).
 *
 * @param {String} phone teléfono tal como está cargado
 * @returns {String|null}
 */
export const formatStoreTelephone = phone => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 8) {
    return null;
  }
  if (digits.startsWith('54')) {
    return `+${digits}`;
  }
  return `+54${digits.replace(/^0+/, '')}`;
};

/**
 * Campos extra del PetStore: address, telephone y areaServed.
 *
 * @param {Object} params
 * @param {String} params.address dirección completa (publicData.location.address)
 * @param {String} params.phone WhatsApp del comercio
 * @returns {Object} campos para sumar al JSON-LD
 */
export const petStoreSchemaFields = ({ address, phone }) => {
  const parsed = parseStoreAddress(address);
  const telephone = formatStoreTelephone(phone);

  const postalAddress = parsed
    ? Object.entries(parsed).reduce(
        (acc, [key, value]) => (value ? { ...acc, [key]: value } : acc),
        { '@type': 'PostalAddress' }
      )
    : null;

  const areaServed = parsed?.addressLocality
    ? { '@type': 'City', name: parsed.addressLocality }
    : null;

  return {
    ...(postalAddress ? { address: postalAddress } : {}),
    ...(telephone ? { telephone } : {}),
    ...(areaServed ? { areaServed } : {}),
  };
};
