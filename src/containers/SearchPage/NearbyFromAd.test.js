import { types as sdkTypes } from '../../util/sdkLoader';

import { boundsAroundPoint, isGoogleAdsVisit } from './NearbyFromAd';

const { LatLng } = sdkTypes;

describe('NearbyFromAd', () => {
  describe('isGoogleAdsVisit', () => {
    it('detects the campaign UTM', () => {
      expect(
        isGoogleAdsVisit('?address=CABA&utm_source=google&utm_medium=cpc&utm_campaign=gps')
      ).toBe(true);
    });

    it('detects Google Ads auto-tagging', () => {
      expect(isGoogleAdsVisit('?address=CABA&gclid=abc123')).toBe(true);
    });

    it('ignores other visits', () => {
      expect(isGoogleAdsVisit('?address=CABA')).toBe(false);
      expect(isGoogleAdsVisit('?utm_source=facebook')).toBe(false);
      expect(isGoogleAdsVisit('')).toBe(false);
    });
  });

  describe('boundsAroundPoint', () => {
    it('builds a box of the given radius around the point', () => {
      // Guernica
      const point = new LatLng(-34.9167, -58.3833);
      const bounds = boundsAroundPoint(point, 30);

      expect(bounds.ne.lat).toBeGreaterThan(point.lat);
      expect(bounds.sw.lat).toBeLessThan(point.lat);
      expect(bounds.ne.lng).toBeGreaterThan(point.lng);
      expect(bounds.sw.lng).toBeLessThan(point.lng);

      // 30 km ≈ 0,27° de latitud
      expect(bounds.ne.lat - point.lat).toBeCloseTo(0.2695, 3);
      // En longitud el grado es más corto lejos del ecuador, así que el delta es mayor
      expect(bounds.ne.lng - point.lng).toBeGreaterThan(bounds.ne.lat - point.lat);
    });
  });
});
