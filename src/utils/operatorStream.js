import { getStoredApiKey, getStoredOwnerKey, getStoredSessionToken } from './authStorage';

const buildStreamHeaders = () => {
  const headers = {
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache',
  };
  const apiKey = getStoredApiKey();
  const ownerKey = getStoredOwnerKey();
  const sessionToken = getStoredSessionToken();

  if (apiKey) headers['x-api-key'] = apiKey;
  if (ownerKey) headers['x-owner-key'] = ownerKey;
  if (sessionToken) headers['x-user-token'] = sessionToken;

  return headers;
};

const parseSseChunk = (chunk) => {
  const lines = chunk.split('\n');
  let event = 'message';
  const dataLines = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  return {
    event,
    data: dataLines.join('\n'),
  };
};

export const streamOperatorRun = async (url, { signal, onRun }) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: buildStreamHeaders(),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Operator stream failed with ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Operator stream is not available in this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const parsed = parseSseChunk(part);
      if (!parsed?.data) continue;

      try {
        const payload = JSON.parse(parsed.data);
        if (payload?.run) {
          onRun?.(payload.run, payload);
        }
      } catch (error) {
        console.error('Failed to parse operator stream payload:', error, parsed.data);
      }
    }
  }

  const trailing = parseSseChunk(buffer);
  if (trailing?.data) {
    const payload = JSON.parse(trailing.data);
    if (payload?.run) {
      onRun?.(payload.run, payload);
    }
  }
};
