import React, { useEffect } from 'react';

import CMSPage from '../CMSPage/CMSPage';

const STONECAT_URL = 'https://catlitterstonecat.com/';

const isMobileOrTablet = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const ua = window.navigator.userAgent || '';

  const isIPadOS = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;

  return /Android|iPhone|iPad|iPod/i.test(ua) || isIPadOS;
};

const shouldSkipDesktopRedirect = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  const params = new URLSearchParams(window.location.search);
  const hostname = window.location.hostname;

  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPreview = params.get('preview') === '1';

  return isLocal || isPreview;
};

const StonyGotchiPage = props => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (shouldSkipDesktopRedirect() || isMobileOrTablet()) {
      return;
    }

    window.location.replace(`${STONECAT_URL}${window.location.search}`);
  }, []);

  return <CMSPage {...props} params={{ pageId: 'stonygotchi' }} />;
};

export default StonyGotchiPage;
