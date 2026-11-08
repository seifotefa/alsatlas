import assert from 'node:assert/strict';
import test from 'node:test';
import { checkinQuestions, checkinTurn, consultClose, inPersonClose, notedClose, voiceNotePrompt } from './agents.js';
import { applyTranscript, emptyDraft } from './voice-checkin.js';

test('the check-in asks three questions, takes a voice note, then closes once', () => {
  const first = checkinTurn('About usual');
  assert.equal(first.say, checkinQuestions[1]);
  assert.equal(first.done, false);
  const second = checkinTurn('Nothing new', first.threadId);
  assert.equal(second.say, checkinQuestions[2]);
  const third = checkinTurn('No', second.threadId);
  assert.equal(third.say, voiceNotePrompt);
  const close = checkinTurn('Today was steady.', third.threadId);
  assert.equal(close.say, notedClose);
  assert.equal(close.done, true);
  const again = checkinTurn('What is his ALSFRS-R?', close.threadId);
  assert.equal(again.say, notedClose);
});

test('a fall or trouble breathing is named only after the voice note', () => {
  const visit = ['About usual', 'I had a fall', 'No', 'That is the note.'].reduce<{ threadId?: string; say: string; escalation: string }>((turn, answer) => checkinTurn(answer, turn.threadId), { say: '', escalation: 'none' });
  assert.equal(visit.say, consultClose);
  assert.equal(visit.escalation, 'virtual');
  const emergency = ['Lower than usual', 'Nothing new', 'I cannot breathe', 'Please note that.'].reduce<{ threadId?: string; say: string; escalation: string }>((turn, answer) => checkinTurn(answer, turn.threadId), { say: '', escalation: 'none' });
  assert.equal(emergency.say, inPersonClose);
  assert.equal(emergency.escalation, 'urgent');
});

test('a spoken check-in captures dizziness and the right arm', () => {
  const first = applyTranscript(emptyDraft(), 'I want to start a check-in');
  assert.equal(first.readyToSave, false);
  const heard = applyTranscript(first.draft, 'I was feeling a little bit dizzy yesterday. My right arm did not feel it as much.');
  assert.equal(heard.draft.energy, 'Lower than usual');
  assert.deepEqual(heard.draft.changes, ['Dizziness', 'Right arm']);
  assert.match(heard.say, /Should I save/);
  const saved = applyTranscript(heard.draft, 'Yes, save it');
  assert.equal(saved.readyToSave, true);
  assert.equal(saved.draft.phase, 'saved');
});
