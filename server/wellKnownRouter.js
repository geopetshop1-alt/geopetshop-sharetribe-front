const express = require('express');
const { openIdConfiguration, jwksUri } = require('./api-util/idToken');

const rsaPrivateKey = process.env.RSA_PRIVATE_KEY;
const rsaPublicKey = process.env.RSA_PUBLIC_KEY;
const keyId = process.env.KEY_ID;

const router = express.Router();

const androidAssetLinks = [
  {
    // handle_all_urls: links de geopetshop.com abren la app.
    // get_login_creds: el celular comparte contraseñas guardadas entre el sitio y la app.
    relation: [
      'delegate_permission/common.handle_all_urls',
      'delegate_permission/common.get_login_creds',
    ],
    target: {
      namespace: 'android_app',
      package_name: 'com.geopetshop.app',
      sha256_cert_fingerprints: [
        '86:07:C4:7F:F6:44:03:6D:29:63:D7:E4:7D:29:B6:E4:E3:E3:C6:96:09:B6:DE:B1:7C:BA:24:6B:72:1A:E1:C3',
        // Clave de firma de Google Play (Play Console > Firma de aplicaciones).
        // Sin esta, los links y el autorrelleno no andan en la app bajada de Play.
        'B2:11:16:B4:A0:B5:63:2D:05:E1:31:D7:FF:82:14:49:A4:3F:59:E4:E3:DA:C7:D1:6F:AC:D8:07:F5:33:30:72',
      ],
    },
  },
];

const appleAppSiteAssociation = {
  applinks: {
    apps: [],
    details: [
      {
        appID: 'V59Z742W72.com.geopetshop.app',
        paths: ['/stonygotchi', '/stonygotchi/*', '/p/app-confirmada', '/p/app-confirmada/*'],
      },
    ],
  },
  // Autorrelleno de contraseñas en iOS (llavero compartido entre el sitio y la app).
  webcredentials: {
    apps: ['V59Z742W72.com.geopetshop.app'],
  },
};

router.get('/assetlinks.json', (req, res) => {
  res.json(androidAssetLinks);
});

router.get('/apple-app-site-association', (req, res) => {
  res.json(appleAppSiteAssociation);
});

// These .well-known/* endpoints will be enabled if you are using this template as OIDC proxy
// https://www.sharetribe.com/docs/cookbook-social-logins-and-sso/setup-open-id-connect-proxy/
if (rsaPublicKey && rsaPrivateKey) {
  router.get('/openid-configuration', openIdConfiguration);
  router.get('/jwks.json', jwksUri([{ alg: 'RS256', rsaPublicKey, keyId }]));
}

module.exports = router;
