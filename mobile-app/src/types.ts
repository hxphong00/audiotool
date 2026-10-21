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

export interface SpeakerInfo {
  name: string;
  voice: string;
  gender?: 'male' | 'female' | string;
}

export interface DialogueData {
  conversation_id: string;
  title: string;
  created_at?: string;
  total_duration: number;
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
