const { isHttpUrl } = require('./targetRouting.cjs');

const INTERNAL_HOST_GROUPS = [
  ['chatgpt.com', 'chat.openai.com', 'auth.openai.com', 'openai.com', 'oaistatic.com', 'oaiusercontent.com'],
  ['gemini.google.com', 'accounts.google.com', 'google.com', 'googleapis.com', 'googleusercontent.com', 'gstatic.com'],
  ['claude.ai', 'anthropic.com', 'accounts.google.com', 'appleid.apple.com', 'auth0.com'],
  ['chat.deepseek.com', 'deepseek.com'],
  ['grok.com', 'x.ai', 'x.com', 'twitter.com'],
  ['doubao.com', 'www.doubao.com', 'bytedance.com', 'byteoversea.com'],
  ['chatglm.cn', 'z.ai', 'bigmodel.cn'],
  ['copilot.microsoft.com', 'microsoft.com', 'live.com', 'login.live.com'],
  ['chat.qwen.ai', 'qwen.ai', 'alibaba.com', 'aliyun.com'],
];

function getHostname(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function hostMatchesDomain(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function hostsShareDomain(hostname, otherHostname) {
  return hostMatchesDomain(hostname, otherHostname) || hostMatchesDomain(otherHostname, hostname);
}

function hostsShareInternalGroup(hostname, otherHostname) {
  return INTERNAL_HOST_GROUPS.some((group) => (
    group.some((domain) => hostMatchesDomain(hostname, domain)) &&
    group.some((domain) => hostMatchesDomain(otherHostname, domain))
  ));
}

function shouldKeepNavigationInWebview(currentUrl, targetUrl) {
  if (!isHttpUrl(targetUrl)) return true;

  const currentHostname = getHostname(currentUrl);
  const targetHostname = getHostname(targetUrl);
  if (!currentHostname || !targetHostname) return false;

  return hostsShareDomain(currentHostname, targetHostname) ||
    hostsShareInternalGroup(currentHostname, targetHostname);
}

function shouldOpenInExternalBrowser(currentUrl, targetUrl) {
  return isHttpUrl(targetUrl) && !shouldKeepNavigationInWebview(currentUrl, targetUrl);
}

module.exports = {
  shouldKeepNavigationInWebview,
  shouldOpenInExternalBrowser,
};
