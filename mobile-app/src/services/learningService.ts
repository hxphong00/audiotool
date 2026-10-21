import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BookmarkedSentence,
  DialogueSegment,
  SavedVocabItem,
  SpacedRepetitionRecord,
} from '../types';

const VOCAB_DECK_KEY = '@english_player_saved_vocab_v1';
const BOOKMARKED_SENTENCES_KEY = '@english_player_bookmarked_sentences_v1';
const SM2_RECORDS_KEY = '@english_player_sm2_records_v1';

// ============================================================================
// #13. Sổ tay Từ vựng Cá nhân (Saved Vocabulary Deck)
// ============================================================================

export async function getSavedVocabulary(): Promise<SavedVocabItem[]> {
  try {
    const raw = await AsyncStorage.getItem(VOCAB_DECK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveWordToVocabulary(
  item: Omit<SavedVocabItem, 'id' | 'saved_at'>
): Promise<SavedVocabItem[]> {
  const cleanWord = item.word.trim();
  if (!cleanWord) {
    return getSavedVocabulary();
  }
  const id = cleanWord.toLowerCase();
  const current = await getSavedVocabulary();
  const entry: SavedVocabItem = {
    ...item,
    id,
    word: cleanWord,
    saved_at: new Date().toISOString(),
  };

  // Put newest/updated word at the top of the deck
  const filtered = current.filter((w) => w.id !== id);
  const updated = [entry, ...filtered];
  try {
    await AsyncStorage.setItem(VOCAB_DECK_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage quota errors
  }
  return updated;
}

export async function removeWordFromVocabulary(
  id: string
): Promise<SavedVocabItem[]> {
  const current = await getSavedVocabulary();
  const updated = current.filter((w) => w.id !== id);
  try {
    await AsyncStorage.setItem(VOCAB_DECK_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

// ============================================================================
// #14. Đánh dấu Câu Hay / Câu Khó (Bookmark Sentence Star)
// ============================================================================

export function makeSentenceBookmarkId(
  conversationId: string,
  segmentId: number
): string {
  return `${conversationId}_seg_${segmentId}`;
}

export async function getBookmarkedSentences(): Promise<BookmarkedSentence[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKMARKED_SENTENCES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleSentenceBookmark(
  conversationId: string,
  dialogueTitle: string,
  segment: DialogueSegment
): Promise<{ bookmarked: boolean; list: BookmarkedSentence[] }> {
  const id = makeSentenceBookmarkId(conversationId, segment.id);
  const current = await getBookmarkedSentences();
  const exists = current.some((b) => b.id === id);

  let updated: BookmarkedSentence[];
  if (exists) {
    updated = current.filter((b) => b.id !== id);
  } else {
    const newBookmark: BookmarkedSentence = {
      id,
      conversation_id: conversationId,
      dialogue_title: dialogueTitle,
      segment_id: segment.id,
      speaker: segment.speaker_name || segment.speaker,
      text_en: segment.text_en,
      text_vi: segment.text_vi,
      start: segment.start,
      end: segment.end,
      saved_at: new Date().toISOString(),
    };
    updated = [newBookmark, ...current];
  }

  try {
    await AsyncStorage.setItem(
      BOOKMARKED_SENTENCES_KEY,
      JSON.stringify(updated)
    );
  } catch {
    // ignore
  }

  return { bookmarked: !exists, list: updated };
}

export async function removeSentenceBookmark(
  id: string
): Promise<BookmarkedSentence[]> {
  const current = await getBookmarkedSentences();
  const updated = current.filter((b) => b.id !== id);
  try {
    await AsyncStorage.setItem(
      BOOKMARKED_SENTENCES_KEY,
      JSON.stringify(updated)
    );
  } catch {
    // ignore
  }
  return updated;
}

// ============================================================================
// #15. Tự động Nhắc Ôn tập Ngắt quãng (Spaced Repetition Review / Anki SM-2)
// Lịch chuẩn: 1 ngày -> 3 ngày -> 7 ngày -> 14 ngày -> ...
// ============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateSM2Schedule(
  prev: SpacedRepetitionRecord | null,
  quality: 3 | 4 | 5,
  conversationId: string,
  nowMs: number = Date.now()
): SpacedRepetitionRecord {
  const prevReps = prev?.repetitions ?? 0;
  const prevEase = prev?.ease_factor ?? 2.5;
  const prevInterval = prev?.interval_days ?? 1;

  let intervalDays = 1;
  let nextReps = prevReps + 1;

  if (quality === 3) {
    // Ôn lại sau 1 ngày (Cần củng cố)
    intervalDays = 1;
    nextReps = 1;
  } else if (quality === 4) {
    // Ôn lại sau 3 ngày (hoặc theo bậc SM-2: 1 -> 3 -> 7)
    if (prevReps === 0) {
      intervalDays = 3;
    } else if (prevReps === 1) {
      intervalDays = 3;
    } else if (prevReps === 2) {
      intervalDays = 7;
    } else {
      intervalDays = Math.max(7, Math.round(prevInterval * prevEase));
    }
  } else {
    // quality === 5: Nhớ tốt -> nhảy lên mốc 7 ngày (hoặc nhân hệ số SM-2)
    if (prevReps <= 1) {
      intervalDays = 7;
      nextReps = Math.max(2, nextReps);
    } else {
      intervalDays = Math.max(7, Math.round(prevInterval * prevEase));
    }
  }

  // Công thức chuẩn SM-2 cập nhật Ease Factor (tối thiểu 1.3)
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const nextEase = Math.max(1.3, Number((prevEase + delta).toFixed(2)));

  const nowIso = new Date(nowMs).toISOString();
  const nextIso = new Date(nowMs + intervalDays * DAY_MS).toISOString();

  return {
    conversation_id: conversationId,
    interval_days: intervalDays,
    repetitions: nextReps,
    ease_factor: nextEase,
    last_reviewed_at: nowIso,
    next_review_at: nextIso,
  };
}

export async function getAllSM2Records(): Promise<
  Record<string, SpacedRepetitionRecord>
> {
  try {
    const raw = await AsyncStorage.getItem(SM2_RECORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function ensureInitialSM2Schedule(
  conversationId: string
): Promise<SpacedRepetitionRecord> {
  const all = await getAllSM2Records();
  if (all[conversationId]) {
    return all[conversationId];
  }
  const nowMs = Date.now();
  const initial: SpacedRepetitionRecord = {
    conversation_id: conversationId,
    interval_days: 1,
    repetitions: 0,
    ease_factor: 2.5,
    last_reviewed_at: new Date(nowMs).toISOString(),
    // Bài mới học hôm nay sẽ tự động nhắc ôn sau 1 ngày (chuẩn 1 -> 3 -> 7 ngày)
    next_review_at: new Date(nowMs + 1 * DAY_MS).toISOString(),
  };
  all[conversationId] = initial;
  try {
    await AsyncStorage.setItem(SM2_RECORDS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
  return initial;
}

export async function recordDialogueReviewSM2(
  conversationId: string,
  quality: 3 | 4 | 5
): Promise<SpacedRepetitionRecord> {
  const all = await getAllSM2Records();
  const updated = calculateSM2Schedule(
    all[conversationId] || null,
    quality,
    conversationId
  );
  all[conversationId] = updated;
  try {
    await AsyncStorage.setItem(SM2_RECORDS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
  return updated;
}

export function isSM2Due(
  record?: SpacedRepetitionRecord,
  nowMs: number = Date.now()
): boolean {
  if (!record || !record.next_review_at) return false;
  const dueMs = new Date(record.next_review_at).getTime();
  return !Number.isNaN(dueMs) && dueMs <= nowMs;
}

export function formatSM2StatusLabel(
  record?: SpacedRepetitionRecord,
  nowMs: number = Date.now()
): { label: string; isDue: boolean } {
  if (!record) {
    return { label: '📅 Chưa xếp lịch SM-2', isDue: false };
  }
  const dueMs = new Date(record.next_review_at).getTime();
  if (Number.isNaN(dueMs)) {
    return { label: `📅 Chu kỳ ${record.interval_days} ngày`, isDue: false };
  }
  const diffMs = dueMs - nowMs;
  if (diffMs <= 0) {
    return {
      label: `🔔 Đến hạn ôn tập (${record.interval_days} ngày)`,
      isDue: true,
    };
  }
  const diffDays = Math.ceil(diffMs / DAY_MS);
  return {
    label: `📅 Ôn lại sau ${diffDays} ngày (mốc ${record.interval_days}d)`,
    isDue: false,
  };
}
