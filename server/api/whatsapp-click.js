const supabaseUrl = process.env.REACT_APP_STONYGOTCHI_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_STONYGOTCHI_SUPABASE_ANON_KEY;

module.exports = async (req, res) => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase env vars are missing');
      return res.status(500).json({ ok: false });
    }

    const {
      comercioListingId,
      comercioNombre,
      productoListingId,
      productoNombre,
      telefonoWhatsapp,
      origen,
      path,
    } = req.body || {};

    const missing = [];

    if (!comercioListingId) missing.push('comercioListingId');
    if (!telefonoWhatsapp) missing.push('telefonoWhatsapp');
    if (!origen) missing.push('origen');

    if (missing.length) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields',
        missing,
        received: req.body,
      });
    }

    if (!['comercio', 'producto'].includes(origen)) {
      return res.status(400).json({ ok: false, error: 'Invalid origin' });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/web_whatsapp_clicks`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        comercio_listing_id: comercioListingId,
        comercio_nombre: comercioNombre || null,
        producto_listing_id: productoListingId || null,
        producto_nombre: productoNombre || null,
        telefono_whatsapp: telefonoWhatsapp,
        origen,
        path: path || null,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Supabase whatsapp tracking error:', response.status, errorBody);
      return res.status(502).json({ ok: false });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('WhatsApp click tracking failed:', error);
    return res.status(500).json({ ok: false });
  }
};
