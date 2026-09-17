const supabaseUrl = process.env.REACT_APP_STONYGOTCHI_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_STONYGOTCHI_SUPABASE_ANON_KEY;

const VALID_ACTIONS = ['vista', 'aviso_cobertura', 'comercio_sugerido'];
const VALID_CATEGORIES = ['productos', 'tienda', 'servicios'];

module.exports = async (req, res) => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase env vars are missing');
      return res.status(500).json({ ok: false });
    }

    const body = req.body || {};

    const {
      accion,
      caso,
      categoria,
      zonaOriginal,
      direccionTexto,
      ciudad,
      provincia,
      pais,
      codigoPostal,
      lat,
      lng,
      termino,
      filtros,
      cantidadComerciosZona,
      comercioCercanoListingId,
      comercioCercanoNombre,
      comercioCercanoZona,
      distanciaCercanoKm,
      userId,
      email,
      comercioSugeridoNombre,
      comercioSugeridoTelefono,
      path,
      metadata,
    } = body;

    if (!VALID_ACTIONS.includes(accion)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid accion',
      });
    }

    if (![1, 2].includes(Number(caso))) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid caso',
      });
    }

    if (categoria && !VALID_CATEGORIES.includes(categoria)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid categoria',
      });
    }

    if (accion === 'aviso_cobertura' && !email) {
      return res.status(400).json({
        ok: false,
        error: 'Email is required',
      });
    }

    if (accion === 'comercio_sugerido' && !comercioSugeridoNombre) {
      return res.status(400).json({
        ok: false,
        error: 'comercioSugeridoNombre is required',
      });
    }

    const row = {
      accion,
      caso: Number(caso),
      categoria: categoria || null,

      zona_original: zonaOriginal || null,
      direccion_texto: direccionTexto || null,
      ciudad: ciudad || null,
      provincia: provincia || null,
      pais: pais || null,
      codigo_postal: codigoPostal || null,

      lat: typeof lat === 'number' ? lat : null,
      lng: typeof lng === 'number' ? lng : null,

      termino: termino || null,
      filtros: filtros || null,

      cantidad_comercios_zona:
        typeof cantidadComerciosZona === 'number' ? cantidadComerciosZona : null,

      comercio_cercano_listing_id: comercioCercanoListingId || null,
      comercio_cercano_nombre: comercioCercanoNombre || null,
      comercio_cercano_zona: comercioCercanoZona || null,
      distancia_cercano_km:
        typeof distanciaCercanoKm === 'number' ? distanciaCercanoKm : null,

      user_id: userId || null,
      email: email || null,

      comercio_sugerido_nombre: comercioSugeridoNombre || null,
      comercio_sugerido_telefono: comercioSugeridoTelefono || null,

      path: path || null,
      metadata: metadata || null,

      clientify_estado: 'pendiente',
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/web_busquedas_sin_resultados`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(row),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();

      console.error(
        'Supabase search-no-results error:',
        response.status,
        errorBody
      );

      return res.status(502).json({ ok: false });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('search-no-results failed:', error);
    return res.status(500).json({ ok: false });
  }
};
