import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Normalizes a URL to ensure it includes /api exactly once and no trailing slashes.
 */
export const normalizeApiUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

/**
 * Extracts the host IP from the Expo host URI string.
 */
export const extractHostFromExpoHostUri = (hostUri: string): string | null => {
  if (!hostUri) return null;
  const match = hostUri.match(/^([^:/]+)/);
  return match ? match[1] : null;
};

let resolutionSource = 'localhost-fallback';
let resolvedUrl = 'http://localhost:3000/api';

// Priority 1 — Manual override via environment variable
const envUrl = process.env.EXPO_PUBLIC_API_URL;
if (envUrl && envUrl.trim() !== '') {
  resolvedUrl = normalizeApiUrl(envUrl);
  resolutionSource = 'env';
} else {
  // Priority 2 — Expo Go / real phone
  const hostUri = Constants.expoConfig?.hostUri || (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost;
  const extractedHost = hostUri ? extractHostFromExpoHostUri(hostUri) : null;

  if (extractedHost) {
    resolvedUrl = `http://${extractedHost}:3000/api`;
    resolutionSource = 'expo-host-uri';
  } else if (Platform.OS === 'android') {
    // Priority 3 — Android Emulator fallback
    resolvedUrl = 'http://10.0.2.2:3000/api';
    resolutionSource = 'android-emulator';
  } else {
    // Priority 4 — iOS/web/local fallback
    resolvedUrl = 'http://localhost:3000/api';
    resolutionSource = 'localhost-fallback';
  }
}

export const API_BASE_URL = resolvedUrl;
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

if (__DEV__) {
  console.log(`[API] Base URL dynamically resolved: ${API_BASE_URL}`);
  console.log(`[API] Resolution source: ${resolutionSource}`);
}
