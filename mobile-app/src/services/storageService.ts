import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { DialogueData, DialogueSummary } from '../types';
import { getApiBaseUrl } from './apiService';

const OFFLINE_INDEX_KEY = '@audiotool_offline_dialogues_index_v1';
const LAST_ACTIVE_DIALOGUE_KEY = '@audiotool_last_active_dialogue_id';

function getOfflineDir(): string | null {
  if (!FileSystem.documentDirectory) {
    return null;
  }
  return `${FileSystem.documentDirectory}offline_dialogues/`;
}

async function ensureOfflineDir(): Promise<string | null> {
  const dir = getOfflineDir();
  if (!dir) return null;
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
  } catch {
    return null;
  }
}

export async function getOfflineIndex(): Promise<Record<string, DialogueSummary>> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_INDEX_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveOfflineIndex(index: Record<string, DialogueSummary>): Promise<void> {
  try {
    await AsyncStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(index));
  } catch {
    // Ignore storage error
  }
}

export async function isDialogueOffline(conversationId: string): Promise<boolean> {
  const dir = getOfflineDir();
  if (!dir || !conversationId) return false;
  try {
    const mp3Uri = `${dir}${conversationId}.mp3`;
    const jsonUri = `${dir}${conversationId}.json`;
    const [mp3Info, jsonInfo] = await Promise.all([
      FileSystem.getInfoAsync(mp3Uri),
      FileSystem.getInfoAsync(jsonUri),
    ]);
    return Boolean(mp3Info.exists && jsonInfo.exists);
  } catch {
    return false;
  }
}

/**
 * Downloads both MP3 audio and JSON transcript metadata into iPhone's permanent
 * documentDirectory and indexes it in AsyncStorage for 100% offline replay.
 */
export async function saveDialogueOffline(dialogue: DialogueData): Promise<DialogueData> {
  const convId = dialogue.conversation_id;
  const dir = await ensureOfflineDir();
  if (!dir || !convId) {
    return dialogue;
  }

  const localMp3Uri = `${dir}${convId}.mp3`;
  const localJsonUri = `${dir}${convId}.json`;

  const remoteAudioUrl =
    dialogue.audio_url && !dialogue.audio_url.includes('localhost')
      ? dialogue.audio_url
      : `${getApiBaseUrl()}/static/${dialogue.offline_filename || `${convId}.mp3`}`;

  await FileSystem.downloadAsync(remoteAudioUrl, localMp3Uri);

  const offlineData: DialogueData = {
    ...dialogue,
    is_offline: true,
    local_audio_uri: localMp3Uri,
  };

  await FileSystem.writeAsStringAsync(localJsonUri, JSON.stringify(offlineData));

  const index = await getOfflineIndex();
  index[convId] = {
    conversation_id: convId,
    title: dialogue.title,
    created_at: dialogue.created_at || new Date().toISOString(),
    total_duration: dialogue.total_duration,
    segments_count: dialogue.segments?.length || 0,
    is_offline: true,
  };
  await saveOfflineIndex(index);

  return offlineData;
}

export async function getOfflineDialogue(conversationId: string): Promise<DialogueData | null> {
  const dir = getOfflineDir();
  if (!dir || !conversationId) return null;

  try {
    const localMp3Uri = `${dir}${conversationId}.mp3`;
    const localJsonUri = `${dir}${conversationId}.json`;
    const [mp3Info, jsonInfo] = await Promise.all([
      FileSystem.getInfoAsync(localMp3Uri),
      FileSystem.getInfoAsync(localJsonUri),
    ]);

    if (!mp3Info.exists || !jsonInfo.exists) {
      return null;
    }

    const content = await FileSystem.readAsStringAsync(localJsonUri);
    const parsed: DialogueData = JSON.parse(content);
    return {
      ...parsed,
      is_offline: true,
      local_audio_uri: localMp3Uri,
    };
  } catch {
    return null;
  }
}

export async function removeOfflineDialogue(conversationId: string): Promise<void> {
  const dir = getOfflineDir();
  if (dir && conversationId) {
    try {
      await FileSystem.deleteAsync(`${dir}${conversationId}.mp3`, { idempotent: true });
      await FileSystem.deleteAsync(`${dir}${conversationId}.json`, { idempotent: true });
    } catch {
      // Ignore delete error
    }
  }
  const index = await getOfflineIndex();
  delete index[conversationId];
  await saveOfflineIndex(index);
}

export async function getOfflineSummariesList(): Promise<DialogueSummary[]> {
  const index = await getOfflineIndex();
  return Object.values(index).sort((a, b) =>
    (b.created_at || '').localeCompare(a.created_at || '')
  );
}

export async function setLastActiveDialogueId(conversationId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_DIALOGUE_KEY, conversationId);
  } catch {
    // Ignore
  }
}

export async function getLastActiveDialogueId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_ACTIVE_DIALOGUE_KEY);
  } catch {
    return null;
  }
}
