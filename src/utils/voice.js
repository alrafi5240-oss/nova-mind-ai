import api from './api';
import { API_ENDPOINTS } from '../config/api';

const RECORDING_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

const resolveTextPayload = (payload) => {
  const candidates = [payload?.text, payload?.reply, payload?.message, payload?.response, payload?.data?.text];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return '';
};

export const getSupportedRecordingMimeType = () => {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }

  return RECORDING_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || '';
};

export const transcribeVoiceBlob = async (audioBlob) => {
  const extension = (audioBlob?.type || '').includes('mp4')
    ? 'mp4'
    : (audioBlob?.type || '').includes('ogg')
      ? 'ogg'
      : 'webm';
  const formData = new FormData();
  formData.append('file', audioBlob, `nova-voice-input.${extension}`);

  const response = await api.post(API_ENDPOINTS.voiceToText, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const transcript = resolveTextPayload(response?.data);
  if (!transcript) {
    throw new Error('Voice transcription returned empty text.');
  }

  return transcript;
};

export const synthesizeVoiceReply = async (text) => {
  const response = await api.post(
    API_ENDPOINTS.textToVoice,
    { text },
    {
      responseType: 'blob',
    }
  );

  if (!(response?.data instanceof Blob) || response.data.size === 0) {
    throw new Error('Voice synthesis returned empty audio.');
  }

  return response.data;
};

export const stopAudioPlayback = (audio) => {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
};

export const playAudioBlob = async (audioBlob, { onEnded, onError } = {}) => {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);

  const cleanup = () => {
    URL.revokeObjectURL(audioUrl);
  };

  audio.addEventListener(
    'ended',
    () => {
      cleanup();
      onEnded?.();
    },
    { once: true }
  );

  audio.addEventListener(
    'error',
    () => {
      cleanup();
      onError?.(new Error('Audio playback failed.'));
    },
    { once: true }
  );

  try {
    await audio.play();
  } catch (error) {
    cleanup();
    throw error;
  }

  return audio;
};
