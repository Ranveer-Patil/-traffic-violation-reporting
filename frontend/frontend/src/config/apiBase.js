const configuredApiUrl = process.env.REACT_APP_API_URL?.trim();

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

function isPrivateNetworkHost(hostname) {
  if (!hostname) return false;

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }

  if (hostname.endsWith('.local')) return true;

  const ipv4Match = hostname.match(/^(\d{1,3})(?:\.(\d{1,3})){3}$/);
  if (!ipv4Match) return false;

  const parts = hostname.split('.').map(Number);
  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return false;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;

  return false;
}

export default function getApiBase() {
  if (configuredApiUrl) return stripTrailingSlash(configuredApiUrl);

  if (typeof window === 'undefined') return 'http://localhost:5000';

  const { hostname, origin, port } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalhost) return 'http://localhost:5000';
  if (port === '3000' && isPrivateNetworkHost(hostname)) return `http://${hostname}:5000`;

  return `${stripTrailingSlash(origin)}/api`;
}
