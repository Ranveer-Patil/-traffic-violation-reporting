const configuredApiUrl = process.env.REACT_APP_API_URL?.trim();

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

export default function getApiBase() {
  if (configuredApiUrl) return stripTrailingSlash(configuredApiUrl);

  if (typeof window === 'undefined') return 'http://localhost:5000';

  const { hostname, origin } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalhost) return 'http://localhost:5000';

  return `${stripTrailingSlash(origin)}/api`;
}
