const express = require('express');
const { openIdConfiguration, jwksUri } = require('./api-util/idToken');

const rsaPrivateKey = process.env.RSA_PRIVATE_KEY;
const rsaPublicKey = process.env.RSA_PUBLIC_KEY;
const keyId = process.env.KEY_ID;

const router = express.Router();

const androidAssetLinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.geopetshop.app',
      sha256_cert_fingerprints: [
        '86:07:C4:7F:F6:44:03:6D:29:63:D7:E4:7D:29:B6:E4:E3:E3:C6:96:09:B6:DE:B1:7C:BA:24:6B:72:1A:E1:C3',
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
        paths: ['/stonygotchi', '/stonygotchi/*'],
      },
    ],
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
