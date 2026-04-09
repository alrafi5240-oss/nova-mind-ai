const API_KEY_STORAGE_KEY = 'api_key';
const OWNER_KEY_STORAGE_KEY = 'owner_key';
const SESSION_TOKEN_STORAGE_KEY = 'token';
const AUTH_TOKEN_STORAGE_KEY = 'auth_token';
const SESSION_USER_STORAGE_KEY = 'session_user';
const LEGACY_AUTH_STORAGE_KEY = 'nova-mind-auth';
const LEGACY_API_KEY_KEYS = ['USER_API_KEY', 'BACKEND_API_KEY', 'apiKey'];
const LEGACY_OWNER_KEY_KEYS = ['OWNER_KEY', 'OWNER_API_KEY', 'ownerKey'];
const ENV_API_KEY =
  import.meta.env.VITE_BACKEND_API_KEY ||
  import.meta.env.VITE_API_KEY ||
  null;
const ENV_OWNER_KEY =
  import.meta.env.VITE_OWNER_API_KEY ||
  import.meta.env.VITE_OWNER_KEY ||
  null;

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const normalizeValue = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const readJson = (value) => {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const readFromKeys = (keys) => {
  const storage = getStorage();
  if (!storage) return null;

  for (const key of keys) {
    const value = normalizeValue(storage.getItem(key));
    if (value) return value;
  }

  return null;
};

export const getStoredApiKey = () => {
  const storage = getStorage();
  if (!storage) return null;

  const apiKey = readFromKeys([API_KEY_STORAGE_KEY, ...LEGACY_API_KEY_KEYS]) || normalizeValue(ENV_API_KEY);
  if (apiKey) {
    storage.setItem(API_KEY_STORAGE_KEY, apiKey);
  }

  return apiKey;
};

export const setStoredApiKey = (apiKey) => {
  const storage = getStorage();
  if (!storage) return;

  const normalized = normalizeValue(apiKey);
  if (!normalized) {
    return;
  }

  storage.setItem(API_KEY_STORAGE_KEY, normalized);
};

export const clearStoredApiKey = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(API_KEY_STORAGE_KEY);
};

export const getStoredSessionToken = () => {
  const storage = getStorage();
  if (!storage) return null;

  const authToken = normalizeValue(storage.getItem(AUTH_TOKEN_STORAGE_KEY));
  if (authToken) {
    storage.setItem(AUTH_TOKEN_STORAGE_KEY, authToken);
    storage.setItem(SESSION_TOKEN_STORAGE_KEY, authToken);
    return authToken;
  }

  const directToken = normalizeValue(storage.getItem(SESSION_TOKEN_STORAGE_KEY));
  if (directToken) {
    storage.setItem(AUTH_TOKEN_STORAGE_KEY, directToken);
    storage.setItem(SESSION_TOKEN_STORAGE_KEY, directToken);
    return directToken;
  }

  const legacyState = readJson(storage.getItem(LEGACY_AUTH_STORAGE_KEY));
  const legacyToken = normalizeValue(
    legacyState?.state?.accessToken ||
      legacyState?.accessToken ||
      legacyState?.state?.token ||
      legacyState?.token
  );

  if (legacyToken) {
    storage.setItem(AUTH_TOKEN_STORAGE_KEY, legacyToken);
    storage.setItem(SESSION_TOKEN_STORAGE_KEY, legacyToken);
  }

  return legacyToken;
};

export const setStoredSessionToken = (token) => {
  const storage = getStorage();
  if (!storage) return;

  const normalized = normalizeValue(token);
  if (!normalized) {
    return;
  }

  storage.setItem(AUTH_TOKEN_STORAGE_KEY, normalized);
  storage.setItem(SESSION_TOKEN_STORAGE_KEY, normalized);
};

export const getStoredSessionUser = () => {
  const storage = getStorage();
  if (!storage) return null;

  const directUser = readJson(storage.getItem(SESSION_USER_STORAGE_KEY));
  if (directUser && typeof directUser === 'object') {
    storage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(directUser));
    return directUser;
  }

  const legacyState = readJson(storage.getItem(LEGACY_AUTH_STORAGE_KEY));
  const legacyUser = legacyState?.state?.user || legacyState?.user || null;

  if (legacyUser && typeof legacyUser === 'object') {
    storage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(legacyUser));
    return legacyUser;
  }

  return null;
};

export const setStoredSessionUser = (user) => {
  const storage = getStorage();
  if (!storage) return;
  if (!user || typeof user !== 'object') return;

  storage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredSessionToken = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  storage.removeItem(SESSION_TOKEN_STORAGE_KEY);
};

export const clearStoredSessionUser = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(SESSION_USER_STORAGE_KEY);
};

export const getStoredOwnerKey = () => {
  const storage = getStorage();
  if (!storage) return null;

  const ownerKey = readFromKeys([OWNER_KEY_STORAGE_KEY, ...LEGACY_OWNER_KEY_KEYS]) || normalizeValue(ENV_OWNER_KEY);
  if (ownerKey) {
    storage.setItem(OWNER_KEY_STORAGE_KEY, ownerKey);
  }

  return ownerKey;
};

export const setStoredOwnerKey = (ownerKey) => {
  const storage = getStorage();
  if (!storage) return;

  const normalized = normalizeValue(ownerKey);
  if (!normalized) {
    return;
  }

  storage.setItem(OWNER_KEY_STORAGE_KEY, normalized);
};

export const clearStoredOwnerKey = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(OWNER_KEY_STORAGE_KEY);
};

export const syncAuthStorage = () => {
  getStoredApiKey();
  getStoredOwnerKey();
  getStoredSessionToken();
  getStoredSessionUser();
};

export {
  AUTH_TOKEN_STORAGE_KEY,
  API_KEY_STORAGE_KEY,
  OWNER_KEY_STORAGE_KEY,
  SESSION_TOKEN_STORAGE_KEY,
  SESSION_USER_STORAGE_KEY,
};
