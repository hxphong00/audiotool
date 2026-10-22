import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateSM2Schedule,
  formatSM2StatusLabel,
  isSM2Due,
  makeSentenceBookmarkId,
} from '../src/services/learningService';

import {
  findActiveOrPrecedingSegmentIndex,
} from '../src/services/trackPlayerService';

import { DialogueSegment, SpacedRepetitionRecord } from '../src/types';

// ============================================================================
// TEST SUITE 1: SuperMemo SM-2 Spaced Repetition Scheduling
// ============================================================================

test('SM-2: initial review with quality 3 (Hard) schedules for 1 day', () => {
  const baseNow = 1700000000000;
  const record = calculateSM2Schedule(null, 3, 'conv_test_01', baseNow);

  assert.equal(record.conversation_id, 'conv_test_01');
  assert.equal(record.interval_days, 1);
  assert.equal(record.repetitions, 1);
  assert.ok(record.ease_factor >= 1.3);

  const nextReviewMs = new Date(record.next_review_at).getTime();
  assert.equal(nextReviewMs, baseNow + 1 * 24 * 60 * 60 * 1000);
});

test('SM-2: initial review with quality 4 (Good) schedules for 3 days', () => {
  const baseNow = 1700000000000;
  const record = calculateSM2Schedule(null, 4, 'conv_test_02', baseNow);

  assert.equal(record.interval_days, 3);
  assert.equal(record.repetitions, 1);
  assert.ok(record.ease_factor >= 1.3);
});

test('SM-2: initial review with quality 5 (Easy) schedules for 7 days', () => {
  const baseNow = 1700000000000;
  const record = calculateSM2Schedule(null, 5, 'conv_test_03', baseNow);

  assert.equal(record.interval_days, 7);
  assert.equal(record.repetitions, 2);
  assert.ok(record.ease_factor >= 2.5);
});

test('SM-2: ease factor floor constraint (EF >= 1.3)', () => {
  let rec: SpacedRepetitionRecord | null = null;
  // Grade difficulty repeatedly to force EF downward
  for (let i = 0; i < 15; i++) {
    rec = calculateSM2Schedule(rec, 3, 'conv_hard', 1700000000000 + i * 1000);
  }
  assert.ok(rec !== null);
  assert.ok(rec.ease_factor >= 1.3, `Ease factor ${rec.ease_factor} must be >= 1.3`);
});

test('SM-2: isSM2Due correctly detects past vs future due dates', () => {
  const nowMs = 1700000000000;
  const dueRecord: SpacedRepetitionRecord = {
    conversation_id: 'conv_due',
    interval_days: 1,
    repetitions: 1,
    ease_factor: 2.5,
    last_reviewed_at: new Date(nowMs - 86400000 * 2).toISOString(),
    next_review_at: new Date(nowMs - 1000).toISOString(), // 1 second ago -> DUE
  };

  const futureRecord: SpacedRepetitionRecord = {
    conversation_id: 'conv_future',
    interval_days: 3,
    repetitions: 1,
    ease_factor: 2.5,
    last_reviewed_at: new Date(nowMs).toISOString(),
    next_review_at: new Date(nowMs + 86400000 * 2).toISOString(), // 2 days later -> NOT DUE
  };

  assert.equal(isSM2Due(dueRecord, nowMs), true);
  assert.equal(isSM2Due(futureRecord, nowMs), false);
});

test('SM-2: formatSM2StatusLabel returns expected human-readable status', () => {
  const nowMs = 1700000000000;
  const dueRecord: SpacedRepetitionRecord = {
    conversation_id: 'conv_1',
    interval_days: 3,
    repetitions: 1,
    ease_factor: 2.5,
    last_reviewed_at: new Date(nowMs - 86400000 * 4).toISOString(),
    next_review_at: new Date(nowMs - 1000).toISOString(),
  };

  const status = formatSM2StatusLabel(dueRecord, nowMs);
  assert.equal(status.isDue, true);
  assert.match(status.label, /Đến hạn ôn tập/);
});

// ============================================================================
// TEST SUITE 2: Sentence Bookmark ID Generator
// ============================================================================

test('Bookmark: makeSentenceBookmarkId creates deterministic, unique keys', () => {
  const key1 = makeSentenceBookmarkId('conv_abc123', 1);
  const key2 = makeSentenceBookmarkId('conv_abc123', 2);
  const key3 = makeSentenceBookmarkId('conv_xyz999', 1);

  assert.equal(key1, 'conv_abc123_seg_1');
  assert.equal(key2, 'conv_abc123_seg_2');
  assert.equal(key3, 'conv_xyz999_seg_1');
  assert.notEqual(key1, key2);
  assert.notEqual(key1, key3);
});

// ============================================================================
// TEST SUITE 3: Real-Time Segment Index Timing & Pause Bridging
// ============================================================================

const SAMPLE_SEGMENTS: DialogueSegment[] = [
  {
    id: 1,
    speaker: 'Alex',
    speaker_name: 'Alex',
    start: 0.0,
    end: 3.0,
    text_en: 'Sentence one.',
    text_vi: 'Câu một.',
    words: [{ word: 'Sentence', start: 0.0, end: 1.5 }, { word: 'one.', start: 1.6, end: 3.0 }],
  },
  {
    id: 2,
    speaker: 'Sarah',
    speaker_name: 'Sarah',
    start: 3.4, // 400ms pause gap between 3.0 and 3.4
    end: 7.0,
    text_en: 'Sentence two.',
    text_vi: 'Câu hai.',
    words: [{ word: 'Sentence', start: 3.4, end: 5.0 }, { word: 'two.', start: 5.1, end: 7.0 }],
  },
  {
    id: 3,
    speaker: 'Alex',
    speaker_name: 'Alex',
    start: 7.4,
    end: 10.0,
    text_en: 'Sentence three.',
    text_vi: 'Câu ba.',
    words: [{ word: 'Sentence', start: 7.4, end: 8.5 }, { word: 'three.', start: 8.6, end: 10.0 }],
  },
];

test('Karaoke: findActiveOrPrecedingSegmentIndex accurately matches timestamps', () => {
  // Inside segment 1
  assert.equal(findActiveOrPrecedingSegmentIndex(SAMPLE_SEGMENTS, 1.5), 0);

  // In the 400ms silence bridge between seg 1 and seg 2 (at 3.2s)
  // Must return 0 so the active card does not flicker off during pauses
  assert.equal(findActiveOrPrecedingSegmentIndex(SAMPLE_SEGMENTS, 3.2), 0);

  // Inside segment 2
  assert.equal(findActiveOrPrecedingSegmentIndex(SAMPLE_SEGMENTS, 5.0), 1);

  // Inside segment 3
  assert.equal(findActiveOrPrecedingSegmentIndex(SAMPLE_SEGMENTS, 8.0), 2);

  // At the exact start
  assert.equal(findActiveOrPrecedingSegmentIndex(SAMPLE_SEGMENTS, 0.0), 0);
});

test('Karaoke: findActiveOrPrecedingSegmentIndex handles edge cases safely', () => {
  // Empty array
  assert.equal(findActiveOrPrecedingSegmentIndex([], 5.0), -1);

  // Position beyond the last segment
  assert.equal(findActiveOrPrecedingSegmentIndex(SAMPLE_SEGMENTS, 15.0), 2);
});

// ============================================================================
// TEST SUITE 4: Vocabulary Deck Persistence & CRUD
// ============================================================================

test('Vocab Deck: saveWordToVocabulary stores and retrieves words cleanly', async () => {
  const {
    getSavedVocabulary,
    saveWordToVocabulary,
    removeWordFromVocabulary,
  } = await import('../src/services/learningService');

  // Clean initial state
  const initial = await getSavedVocabulary();
  for (const item of initial) {
    await removeWordFromVocabulary(item.id);
  }

  // Save new word
  const updated = await saveWordToVocabulary({
    word: 'commute',
    phonetic: '/kəˈmjuːt/',
    part_of_speech: 'verb',
    translation_vi: 'đi làm hàng ngày',
    context_en: 'How was your commute today?',
    context_vi: 'Chuyến đi làm hôm nay của bạn thế nào?',
    conversation_id: 'conv_test_commute',
    dialogue_title: 'Commuting in City',
  });

  assert.equal(updated.length, 1);
  assert.equal(updated[0].word, 'commute');
  assert.equal(updated[0].id, 'commute');
  assert.equal(updated[0].translation_vi, 'đi làm hàng ngày');

  // Verify retrieval
  const list = await getSavedVocabulary();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'commute');

  // Remove word
  const afterRemove = await removeWordFromVocabulary('commute');
  assert.equal(afterRemove.length, 0);
});

// ============================================================================
// TEST SUITE 5: Sentence Bookmarking Toggle & Persistence
// ============================================================================

test('Bookmarks: toggleSentenceBookmark adds and removes bookmarks', async () => {
  const {
    getBookmarkedSentences,
    toggleSentenceBookmark,
    removeSentenceBookmark,
  } = await import('../src/services/learningService');

  // Clean up
  const initial = await getBookmarkedSentences();
  for (const b of initial) {
    await removeSentenceBookmark(b.id);
  }

  const segmentToBookmark = SAMPLE_SEGMENTS[0];

  // Toggle on (Add)
  const res1 = await toggleSentenceBookmark(
    'conv_bookmark_test',
    'Morning Traffic',
    segmentToBookmark
  );
  assert.equal(res1.bookmarked, true);
  assert.equal(res1.list.length, 1);
  assert.equal(res1.list[0].text_en, 'Sentence one.');

  // Toggle off (Remove)
  const res2 = await toggleSentenceBookmark(
    'conv_bookmark_test',
    'Morning Traffic',
    segmentToBookmark
  );
  assert.equal(res2.bookmarked, false);
  assert.equal(res2.list.length, 0);
});

// ============================================================================
// TEST SUITE 6: SM-2 Persistence & ensureInitialSM2Schedule
// ============================================================================

test('SM-2: ensureInitialSM2Schedule creates 1-day interval if uninitialized', async () => {
  const {
    ensureInitialSM2Schedule,
    getAllSM2Records,
    recordDialogueReviewSM2,
  } = await import('../src/services/learningService');

  const rec = await ensureInitialSM2Schedule('conv_initial_sm2');
  assert.equal(rec.conversation_id, 'conv_initial_sm2');
  assert.equal(rec.interval_days, 1);
  assert.equal(rec.repetitions, 0);

  // Reviewing with rating 5 advances schedule to 7 days
  const reviewed = await recordDialogueReviewSM2('conv_initial_sm2', 5);
  assert.equal(reviewed.interval_days, 7);
  assert.equal(reviewed.repetitions, 2);

  const all = await getAllSM2Records();
  assert.ok(Boolean(all['conv_initial_sm2']));
  assert.equal(all['conv_initial_sm2'].interval_days, 7);
});

// ============================================================================
// TEST SUITE 7: Tap Word to Speak (Precise Word Timestamp Seek)
// ============================================================================

test('Word Seek: findWordTimestamp extracts accurate start time for tapped word', async () => {
  const { findWordTimestamp } = await import('../src/services/trackPlayerService');

  const sampleSegment: DialogueSegment = {
    id: 1,
    speaker: 'Alex',
    speaker_name: 'Alex',
    start: 0.0,
    end: 3.5,
    text_en: 'Hi Sarah, could I get a large iced caramel macchiato please?',
    text_vi: 'Xin chào Sarah, cho tôi xin một ly macchiato caramel đá lớn được không?',
    words: [
      { word: 'Hi', start: 0.11, end: 0.22 },
      { word: 'Sarah,', start: 0.23, end: 0.61 },
      { word: 'could', start: 0.91, end: 1.03 },
      { word: 'iced', start: 1.86, end: 2.1 },
      { word: 'caramel', start: 2.11, end: 2.48 },
      { word: 'macchiato', start: 2.5, end: 3.0 },
      { word: 'please?', start: 3.01, end: 3.51 },
    ],
  };

  // Direct word match with punctuation stripped
  const caramelTimestamp = findWordTimestamp(sampleSegment, 'caramel');
  assert.ok(caramelTimestamp !== null);
  assert.equal(caramelTimestamp.start, 2.11);
  assert.equal(caramelTimestamp.end, 2.48);

  // Word with punctuation attached in text ("macchiato" vs "please?")
  const pleaseTimestamp = findWordTimestamp(sampleSegment, 'please?');
  assert.ok(pleaseTimestamp !== null);
  assert.equal(pleaseTimestamp.start, 3.01);

  // By explicit word index
  const icedByIndex = findWordTimestamp(sampleSegment, 'iced', 3);
  assert.ok(icedByIndex !== null);
  assert.equal(icedByIndex.start, 1.86);

  // Fallback to segment start when word not found
  const unknownWord = findWordTimestamp(sampleSegment, 'espresso');
  assert.ok(unknownWord !== null);
  assert.equal(unknownWord.start, sampleSegment.start);
});

// ============================================================================
// TEST SUITE 8: Free Scrolling Protection (Avoid Jumping while User is Scrolling)
// ============================================================================

test('Free Scroll: shouldAutoScroll pauses auto-jump when user is interacting', async () => {
  const { shouldAutoScroll } = await import('../src/services/trackPlayerService');

  // Normal playback without user interaction -> allow auto-scroll
  assert.equal(shouldAutoScroll(false, 'player', true), true);

  // When user is dragging/scrolling -> BLOCK auto-scroll so screen never jumps
  assert.equal(shouldAutoScroll(true, 'player', true), false);

  // In library or study tabs -> do not auto-scroll
  assert.equal(shouldAutoScroll(false, 'library', true), false);
  assert.equal(shouldAutoScroll(false, 'study', true), false);

  // Empty segments -> do not auto-scroll
  assert.equal(shouldAutoScroll(false, 'player', false), false);
});

