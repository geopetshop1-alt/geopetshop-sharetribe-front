const supabaseUrl = process.env.REACT_APP_STONYGOTCHI_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_STONYGOTCHI_SUPABASE_ANON_KEY;

module.exports = async (req, res) => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase env vars are missing');
      return res.status(500).json({ ok: false });
    }

    const {
      clientifyContactId,
      comercioListingId,
      comercioNombre,
      productoListingId,
      productoNombre,
      origen,
      path,
      sessionId,
    } = req.body || {};

    const missing = [];

    if (!clientifyContactId) missing.push('clientifyContactId');
    if (!comercioListingId) missing.push('comercioListingId');
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
      return res.status(400).json({
        ok: false,
        error: 'Invalid origin',
      });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/web_listing_views`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        clientify_contact_id: String(clientifyContactId),
        comercio_listing_id: String(comercioListingId),
        comercio_nombre: comercioNombre || null,
        producto_listing_id: productoListingId || null,
        producto_nombre: productoNombre || null,
        origen,
        path: path || null,
        session_id: sessionId || null,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Supabase listing view tracking error:', response.status, errorBody);
      return res.status(502).json({ ok: false });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Listing view tracking failed:', error);
    return res.status(500).json({ ok: false });
  }
};
