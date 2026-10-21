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
}

export interface DialogueData {
  conversation_id: string;
  title: string;
  total_duration: number;
  audio_url: string;
  audio_stream_url: string;
  offline_filename: string;
  speakers: Record<string, SpeakerInfo>;
  segments: DialogueSegment[];
}
