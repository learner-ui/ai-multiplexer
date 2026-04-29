function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeWebContentsId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeUrlTarget(value) {
  if (typeof value !== 'string' || !isHttpUrl(value)) return null;
  return new URL(value);
}

function normalizePromptTargetsFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  if (Array.isArray(payload.targets)) {
    const targets = payload.targets
      .map((target) => {
        if (!target || typeof target !== 'object') return null;
        const url = normalizeUrlTarget(target.url);
        if (!url) return null;

        return {
          url,
          webContentsId: normalizeWebContentsId(target.webContentsId),
        };
      })
      .filter(Boolean);

    return targets.length > 0 ? targets : null;
  }

  if (!Array.isArray(payload.targetUrls)) return null;

  const targets = payload.targetUrls
    .map(normalizeUrlTarget)
    .filter(Boolean)
    .map((url) => ({ url, webContentsId: null }));

  return targets.length > 0 ? targets : null;
}

function normalizeNewChatTargetsFromPayload(payload) {
  if (!payload || !Array.isArray(payload.targets)) return [];

  return payload.targets
    .map((target) => {
      if (
        !target ||
        typeof target !== 'object' ||
        typeof target.matchUrl !== 'string' ||
        typeof target.newChatUrl !== 'string' ||
        !isHttpUrl(target.matchUrl) ||
        !isHttpUrl(target.newChatUrl)
      ) {
        return null;
      }

      return {
        matchUrl: new URL(target.matchUrl),
        newChatUrl: target.newChatUrl,
        webContentsId: normalizeWebContentsId(target.webContentsId),
      };
    })
    .filter(Boolean);
}

function hostMatches(contentsUrl, targetUrl) {
  try {
    const url = new URL(contentsUrl);
    return (
      url.hostname === targetUrl.hostname ||
      url.hostname.endsWith(`.${targetUrl.hostname}`)
    );
  } catch {
    return false;
  }
}

function matchesTarget(contents, targets) {
  if (!targets) return true;

  return targets.some((target) => {
    if (target.webContentsId) {
      return contents.id === target.webContentsId;
    }

    return hostMatches(contents.url, target.url);
  });
}

module.exports = {
  isHttpUrl,
  matchesTarget,
  normalizeNewChatTargetsFromPayload,
  normalizePromptTargetsFromPayload,
};
