import { DialogueData } from '../types';

// Mac's LAN IP for seamless iPhone connection
let API_BASE_URL = 'http://192.168.1.220:8000';

export function setApiBaseUrl(url: string) {
  API_BASE_URL = url.replace(/\/$/, '');
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export async function fetchDialogue(id: string): Promise<DialogueData> {
  const res = await fetch(`${API_BASE_URL}/api/dialogue/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dialogue: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDialogueList(): Promise<{ dialogues: any[] }> {
  const res = await fetch(`${API_BASE_URL}/api/dialogue`);
  if (!res.ok) {
    throw new Error(`Failed to list dialogues: ${res.statusText}`);
  }
  return res.json();
}

export async function createDialogue(script: string, title?: string): Promise<DialogueData> {
  const res = await fetch(`${API_BASE_URL}/api/dialogue/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, title: title || 'English Conversation' }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create dialogue: ${res.statusText}`);
  }
  return res.json();
}

export async function lookupWord(word: string): Promise<{ word: string; translation_vi: string }> {
  const clean = word.replace(/[.,?!;:'"()[\]{}]/g, '').trim();
  const res = await fetch(`${API_BASE_URL}/api/dictionary/lookup?word=${encodeURIComponent(clean)}`);
  if (!res.ok) {
    return { word: clean, translation_vi: clean };
  }
  return res.json();
}
