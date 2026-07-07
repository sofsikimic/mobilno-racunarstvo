import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Keširano u memoriji jer je AsyncStorage async, a apiFetch-u treba token odmah.
let cachedToken = null;
let cachedRefreshToken = null;

export async function getToken() {
  if (cachedToken !== null) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token) {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function getRefreshToken() {
  if (cachedRefreshToken !== null) return cachedRefreshToken;
  cachedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  return cachedRefreshToken;
}

export async function setRefreshToken(token) {
  cachedRefreshToken = token;
  if (token) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export async function setTokens(accessToken, refreshToken) {
  await setToken(accessToken);
  await setRefreshToken(refreshToken);
}

export async function clearTokens() {
  await setToken(null);
  await setRefreshToken(null);
}

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Sprečava da više paralelnih 401-ica pokrene više refresh poziva istovremeno.
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('refresh_failed');
        const data = await parseJsonSafe(res);
        if (!data?.access_token) throw new Error('refresh_failed');
        await setToken(data.access_token);
        return data.access_token;
      })
      .catch(async (err) => {
        await clearTokens();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const isAuthEndpoint =
    path.includes('/api/auth/login') ||
    path.includes('/api/auth/register') ||
    path.includes('/api/auth/refresh');

  const doFetch = (token) =>
    fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });

  let token = await getToken();
  let res = await doFetch(token);

  // Access token istekao -> probaj refresh, pa ponovi originalni zahtev jednom.
  if (res.status === 401 && !isAuthEndpoint) {
    const hasRefreshToken = await getRefreshToken();
    if (hasRefreshToken) {
      try {
        token = await refreshAccessToken();
        res = await doFetch(token);
      } catch {
        // refresh nije uspeo, nastavljamo sa originalnim 401 odgovorom
      }
    }
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Request failed (${res.status} ${res.statusText})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}