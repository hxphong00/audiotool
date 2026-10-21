import AsyncStorage from '@react-native-async-storage/async-storage';
import { DialogueData, DialogueSummary, WordLookupResult } from '../types';

const API_URL_STORAGE_KEY = '@audiotool_api_base_url';

// Default Mac LAN IP for iPhone 13 (iOS 18.1) connection over Wi-Fi
let API_BASE_URL = 'http://192.168.1.220:8000';

export async function loadSavedApiBaseUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
    if (saved && saved.trim()) {
      API_BASE_URL = saved.trim().replace(/\/$/, '');
    }
  } catch {
    // Ignore storage read error
  }
  return API_BASE_URL;
}

export async function setApiBaseUrl(url: string): Promise<string> {
  const cleaned = url.trim().replace(/\/$/, '');
  if (cleaned) {
    API_BASE_URL = cleaned.startsWith('http') ? cleaned : `http://${cleaned}`;
    try {
      await AsyncStorage.setItem(API_URL_STORAGE_KEY, API_BASE_URL);
    } catch {
      // Ignore storage write error
    }
  }
  return API_BASE_URL;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Resolves the playable audio URL for a dialogue:
 * 1. If downloaded offline on iPhone (local_audio_uri), uses local file:// URI.
 * 2. Otherwise dynamically builds the HTTP 206 Range stream URL using current API_BASE_URL
 *    so hardcoded localhost or stale LAN IPs never break playback on a physical iPhone.
 */
export function resolvePlayableAudioUrl(data: {
  conversation_id: string;
  local_audio_uri?: string;
  audio_stream_url?: string;
  audio_url?: string;
}): string {
  if (data.local_audio_uri) {
    return data.local_audio_uri;
  }
  if (data.conversation_id && data.conversation_id !== 'sample_01') {
    return `${API_BASE_URL}/api/audio/${data.conversation_id}/stream`;
  }
  if (data.audio_stream_url && !data.audio_stream_url.includes('localhost')) {
    return data.audio_stream_url;
  }
  return `${API_BASE_URL}/api/audio/${data.conversation_id}/stream`;
}

export function normalizeDialogueUrls(data: DialogueData): DialogueData {
  const convId = data.conversation_id;
  const filename = data.offline_filename || `${convId}.mp3`;
  return {
    ...data,
    audio_url: `${API_BASE_URL}/static/${filename}`,
    audio_stream_url: `${API_BASE_URL}/api/audio/${convId}/stream`,
  };
}

export async function fetchDialogue(id: string): Promise<DialogueData> {
  const res = await fetch(`${API_BASE_URL}/api/dialogue/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`Không thể tải bài hội thoại (${res.status})`);
  }
  const raw: DialogueData = await res.json();
  return normalizeDialogueUrls(raw);
}

export async function fetchDialogueList(): Promise<{ dialogues: DialogueSummary[] }> {
  const res = await fetch(`${API_BASE_URL}/api/dialogue`);
  if (!res.ok) {
    throw new Error(`Không thể lấy danh sách bài học (${res.status})`);
  }
  return res.json();
}

export async function createDialogue(script: string, title?: string): Promise<DialogueData> {
  const res = await fetch(`${API_BASE_URL}/api/dialogue/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      script,
      title: (title && title.trim()) || 'English Conversation',
    }),
  });
  if (!res.ok) {
    let errDetail = res.statusText;
    try {
      const errBody = await res.json();
      if (errBody?.detail) errDetail = errBody.detail;
    } catch {
      // Ignore parse error
    }
    throw new Error(`Không thể tạo hội thoại: ${errDetail}`);
  }
  const raw: DialogueData = await res.json();
  return normalizeDialogueUrls(raw);
}

export async function lookupWord(
  word: string,
  context?: string
): Promise<WordLookupResult> {
  const clean = word.replace(/^[^a-zA-Z0-9']+|[^a-zA-Z0-9']+$/g, '').trim();
  const params = new URLSearchParams({
    word: clean,
    context: context || '',
  });
  const res = await fetch(`${API_BASE_URL}/api/dictionary/lookup?${params.toString()}`);
  if (!res.ok) {
    return {
      word: clean,
      phonetic: `/${clean.toLowerCase()}/`,
      part_of_speech: 'Từ vựng (word)',
      translation_vi: clean,
      context_en: context || '',
      context_vi: '',
    };
  }
  return res.json();
}
