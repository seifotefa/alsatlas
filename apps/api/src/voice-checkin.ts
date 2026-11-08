export type CheckinDraft = {
  phase: 'collect' | 'confirm' | 'saved';
  energy: 'Lower than usual' | 'About usual' | 'Higher than usual' | null;
  changes: string[];
  events: string[];
  note: string;
};

const changes: [RegExp, string][] = [
  [/dizz|light-?headed/, 'Dizziness'],
  [/right arm|arm (felt|feels|doesn.?t|didn.?t|not)|couldn.?t feel/, 'Right arm'],
  [/left arm/, 'Left arm'],
  [/speech|slur|voice|talking/, 'Speech'],
  [/swallow/, 'Swallowing'],
  [/breath|short of breath/, 'Breathing'],
  [/walk|leg|foot|stairs|trip/, 'Movement or walking'],
  [/hand|grip|button|writing/, 'Hand use'],
  [/sleep|fatigu|tired/, 'Sleep or fatigue'],
];

export function emptyDraft(): CheckinDraft {
  return { phase: 'collect', energy: null, changes: [], events: [], note: '' };
}

export function energyScore(energy: CheckinDraft['energy']) {
  if (energy === 'Lower than usual') return 1;
  if (energy === 'Higher than usual') return 3;
  return 2;
}

export function applyTranscript(draft: CheckinDraft, transcript: string) {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const next: CheckinDraft = { ...draft, changes: [...draft.changes], events: [...draft.events] };
  if (!text) return { draft: next, say: "I didn't catch that. Tell me how today felt.", readyToSave: false };

  if (next.phase === 'confirm') {
    if (/\b(yes|yeah|yep|save|correct|right|do it|please)\b/.test(lower)) {
      next.phase = 'saved';
      return { draft: next, say: 'Saved. I logged that as a caregiver note, not a diagnosis. It is now part of the progress chart.', readyToSave: true };
    }
    if (/\b(no|nope|change|wait|wrong)\b/.test(lower)) {
      next.phase = 'collect';
      return { draft: next, say: 'Okay. Tell me what I should change.', readyToSave: false };
    }
  }

  if (/start( a)? check-?in|record a check-?in/.test(lower) && !next.note) {
    return { draft: next, say: "I'm ready. How has Alex felt? You can mention energy, dizziness, an arm or leg, speech, or anything else you noticed.", readyToSave: false };
  }

  next.note = next.note ? `${next.note} ${text}` : text;
  if (/better|higher than|stronger|good day/.test(lower)) next.energy = 'Higher than usual';
  else if (/worse|lower than|tired|exhausted|weak|dizzy|didn.?t feel/.test(lower)) next.energy = 'Lower than usual';
  else if (/usual|same as|about the same/.test(lower)) next.energy = 'About usual';
  else if (!next.energy) next.energy = 'About usual';

  for (const [pattern, label] of changes) {
    if (pattern.test(lower) && !next.changes.includes(label)) next.changes.push(label);
  }
  if (/\bfall|\bfell|tripped/.test(lower) && !next.events.includes('Fall or near-fall')) next.events.push('Fall or near-fall');
  if (/chok/.test(lower) && !next.events.includes('Coughing or choking during meals')) next.events.push('Coughing or choking during meals');
  if (/can.?t breathe|cannot breathe|short of breath at rest/.test(lower) && !next.events.includes('Shortness of breath at rest')) next.events.push('Shortness of breath at rest');

  next.phase = 'confirm';
  const summary = [
    `Energy sounds ${next.energy.toLowerCase()}.`,
    next.changes.length ? `I noted ${next.changes.join(', ')}.` : 'I did not hear a specific body change.',
    next.events.length ? `Safety note: ${next.events.join(', ')}.` : '',
    'Should I save this check-in?',
  ].filter(Boolean).join(' ');
  return { draft: next, say: summary, readyToSave: false };
}
