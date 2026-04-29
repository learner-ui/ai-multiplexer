function getBrowserLikeUserAgent(userAgent = '') {
  return userAgent.replace(/\sElectron\/[\d.]+/g, '').trim();
}

function extractChromeCoreUserAgent(userAgent = '') {
  const match = userAgent.match(/Mozilla\/5\.0 .*?AppleWebKit\/537\.36 \(KHTML, like Gecko\) Chrome\/[\d.]+ Safari\/537\.36/);
  return match?.[0] ?? userAgent.trim();
}

function getGeminiCompatibleUserAgent(userAgent = '') {
  return extractChromeCoreUserAgent(getBrowserLikeUserAgent(userAgent)
    .replace(/\sEdg(?:A|iOS)?\/[\d.]+/g, '')
    .replace(/\sOPR\/[\d.]+/g, '')
    .replace(/\sBrave\/[\d.]+/g, '')
    .trim());
}

function getChromeMajorVersion(userAgent = '') {
  const match = getGeminiCompatibleUserAgent(userAgent).match(/Chrome\/(\d+)/);
  return match?.[1] ?? '141';
}

function getClientHintPlatform(platform = process.platform) {
  if (platform === 'darwin') return 'macOS';
  if (platform === 'win32') return 'Windows';
  if (platform === 'linux') return 'Linux';
  return 'Unknown';
}

function getGeminiCompatibleRequestHeaders(userAgent = '', acceptLanguage = '') {
  const normalizedUserAgent = getGeminiCompatibleUserAgent(userAgent);
  const chromeMajorVersion = getChromeMajorVersion(normalizedUserAgent);

  return {
    'User-Agent': normalizedUserAgent,
    'Accept-Language': acceptLanguage,
    'Sec-CH-UA': `"Google Chrome";v="${chromeMajorVersion}", "Chromium";v="${chromeMajorVersion}", "Not=A?Brand";v="24"`,
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': `"${getClientHintPlatform()}"`,
  };
}

module.exports = {
  getBrowserLikeUserAgent,
  getGeminiCompatibleRequestHeaders,
  getGeminiCompatibleUserAgent,
};
