export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface DialogueSegment {
  id: number;
  speaker: string;
  speaker_name: string;
  start: number;
  end: number;
  text_en: string;
  text_vi: string;
  words: WordTimestamp[];
}

export type VoiceAccent = 'us' | 'uk' | 'au' | 'ca';
export type VoiceEmotion = 'natural' | 'cheerful' | 'surprised' | 'serious';

export interface SpeakerInfo {
  name: string;
  voice: string;
  gender?: 'male' | 'female' | string;
  accent?: VoiceAccent | string;
}

export interface DialogueData {
  conversation_id: string;
  title: string;
  created_at?: string;
  total_duration: number;
  silence_sec?: number;
  accent?: VoiceAccent | string;
  emotion?: VoiceEmotion | string;
  audio_url: string;
  audio_stream_url: string;
  offline_filename: string;
  speakers: Record<string, SpeakerInfo>;
  segments: DialogueSegment[];
  is_offline?: boolean;
  local_audio_uri?: string;
}

export interface DialogueSummary {
  conversation_id: string;
  title: string;
  created_at?: string;
  total_duration: number;
  segments_count: number;
  audio_url?: string;
  audio_stream_url?: string;
  is_offline?: boolean;
}

export interface WordLookupResult {
  word: string;
  phonetic: string;
  part_of_speech: string;
  translation_vi: string;
  definition_en?: string;
  definition_vi?: string;
  context_en?: string;
  context_vi?: string;
}

export interface SavedVocabItem {
  id: string;
  word: string;
  phonetic?: string;
  part_of_speech?: string;
  translation_vi: string;
  definition_en?: string;
  context_en?: string;
  context_vi?: string;
  conversation_id?: string;
  dialogue_title?: string;
  segment_start?: number;
  saved_at: string;
}

export interface BookmarkedSentence {
  id: string;
  conversation_id: string;
  dialogue_title: string;
  segment_id: number;
  speaker: string;
  text_en: string;
  text_vi: string;
  start: number;
  end: number;
  saved_at: string;
}

export interface SpacedRepetitionRecord {
  conversation_id: string;
  interval_days: number;
  repetitions: number;
  ease_factor: number;
  last_reviewed_at: string;
  next_review_at: string;
}
