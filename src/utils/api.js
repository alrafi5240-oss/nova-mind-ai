import axios from 'axios';
import { API_BASE, normalizeBaseUrl } from '../config/api';
import {
  clearStoredSessionToken,
  clearStoredSessionUser,
  getStoredApiKey,
  getStoredOwnerKey,
  getStoredSessionToken,
  syncAuthStorage,
} from './authStorage';

export const API_BASE_URL = normalizeBaseUrl(API_BASE);

syncAuthStorage();

const clearStoredAuth = () => {
  clearStoredSessionToken();
  clearStoredSessionUser();
  delete api.defaults.headers.common.Authorization;
  delete api.defaults.headers.common['x-owner-key'];
  delete api.defaults.headers.common['x-user-token'];
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

const maskSecret = (value) => {
  if (!value) return undefined;
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const resolveRequestUrl = (config) => {
  try {
    return new URL(config.url || '', config.baseURL || API_BASE_URL).toString();
  } catch {
    return config.url || API_BASE_URL;
  }
};

const isChatRequest = (config) => {
  const requestUrl = resolveRequestUrl(config);

  try {
    return new URL(requestUrl).pathname === '/api/chat';
  } catch {
    return requestUrl.endsWith('/api/chat');
  }
};

api.interceptors.request.use((config) => {
  const apiKey = getStoredApiKey();
  const ownerKey = getStoredOwnerKey();
  const sessionToken = getStoredSessionToken();
  const headers = config.headers || {};
  const chatRequest = isChatRequest(config);

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  } else {
    delete headers['x-api-key'];
    if (!sessionToken && !ownerKey) {
      console.warn('API request is missing both session auth and service api key.');
    }
  }

  if (ownerKey) {
    headers['x-owner-key'] = ownerKey;
  } else {
    delete headers['x-owner-key'];
  }

  if (sessionToken) {
    headers['x-user-token'] = sessionToken;
  } else {
    delete headers['x-user-token'];
  }

  if (chatRequest) {
    delete headers.Authorization;
  } else if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  } else {
    delete headers.Authorization;
  }

  config.headers = headers;

  console.log('API request headers:', {
    isChatRequest: chatRequest,
    method: (config.method || 'get').toUpperCase(),
    url: resolveRequestUrl(config),
    headers: {
      Authorization: !chatRequest && sessionToken ? `Bearer ${maskSecret(sessionToken)}` : undefined,
      'x-api-key': apiKey ? maskSecret(apiKey) : undefined,
      'x-owner-key': ownerKey ? maskSecret(ownerKey) : undefined,
      'x-user-token': sessionToken ? maskSecret(sessionToken) : undefined,
    },
  });

  return config;
});

export { clearStoredAuth };

export default api;
