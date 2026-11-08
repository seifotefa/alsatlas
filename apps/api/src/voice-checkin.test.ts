import assert from 'node:assert/strict';
import test from 'node:test';
import { checkinQuestions, checkinTurn } from './agents.js';
import { applyTranscript, emptyDraft } from './voice-checkin.js';

test('both agents name an immediate visit or a virtual consultation', () => {
  const emergency = checkinTurn('I cannot breathe');
  assert.equal(emergency.say, 'Go to a doctor immediately.');
  assert.equal(emergency.escalation, 'urgent');
  const visit = checkinTurn('I had a fall yesterday', emergency.threadId);
  assert.match(visit.say, /^Book a virtual consultation\./);
  assert.equal(visit.escalation, 'virtual');
});

test('the check-in asks the same questions and then the video', () => {
  const first = checkinTurn('About usual');
  assert.equal(first.say, checkinQuestions[1]);
  const second = checkinTurn('Nothing new', first.threadId);
  assert.equal(second.say, checkinQuestions[2]);
  const third = checkinTurn('No', second.threadId);
  assert.equal(third.say, checkinQuestions[3]);
  const again = checkinTurn('What is his ALSFRS-R?', third.threadId);
  assert.equal(again.say, checkinQuestions[3]);
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
