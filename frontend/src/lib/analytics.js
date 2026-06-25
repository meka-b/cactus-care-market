import ReactGA from 'react-ga4';

const GA_ID = process.env.REACT_APP_GA_ID;
let initialized = false;

export function initGA() {
  if (!GA_ID) return;
  try {
    ReactGA.initialize(GA_ID);
    initialized = true;
  } catch (e) {
    console.warn('GA init failed:', e);
  }
}

export function trackPageView(path) {
  if (!initialized || !GA_ID) return;
  try {
    ReactGA.send({ hitType: 'pageview', page: path });
  } catch {}
}

export function trackEvent(category, action, label) {
  if (!initialized || !GA_ID) return;
  try {
    ReactGA.event({ category, action, label });
  } catch {}
}
