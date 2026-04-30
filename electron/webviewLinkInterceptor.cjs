const { shouldOpenInExternalBrowser } = require('./navigationRouting.cjs');

function getElementFromValue(value) {
  if (!value || value.nodeType !== 1 || typeof value.closest !== 'function') return null;
  return value;
}

function findAnchorFromClickEvent(event) {
  const path = typeof event?.composedPath === 'function' ? event.composedPath() : [];

  for (const item of path) {
    const element = getElementFromValue(item);
    const anchor = element?.closest('a[href]');
    if (anchor) return anchor;
  }

  return getElementFromValue(event?.target)?.closest('a[href]') ?? null;
}

function getExternalLinkFromClickEvent(event, currentUrl) {
  if (event?.button !== 0) return null;

  const anchor = findAnchorFromClickEvent(event);
  const href = typeof anchor?.href === 'string' ? anchor.href : '';
  if (!shouldOpenInExternalBrowser(currentUrl, href)) return null;

  return href;
}

module.exports = {
  getExternalLinkFromClickEvent,
};
