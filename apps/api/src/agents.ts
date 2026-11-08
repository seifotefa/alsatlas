export const checkinQuestions = [
  'How is Alex’s energy today: lower than usual, about usual, or higher than usual?',
  'What has changed since the last check-in: speech, swallowing, breathing, walking, hands, or nothing new?',
  'Did a fall, choking, or shortness of breath at rest happen?',
];

export const voiceNotePrompt = 'Record a short voice note about today.';
export const inPersonClose = 'Go in and see a doctor in person.';
export const consultClose = 'Book a virtual consultation.';
export const notedClose = "Yes, I've noted that down. Thanks for checking in.";

export const immediateCare = 'Go to a doctor immediately.';
export const virtualCare = 'Book a virtual consultation.';

export type Escalation = 'immediate' | 'virtual' | 'none';

export function escalationFor(message: string): Escalation {
  const text = message.toLowerCase();
  if (/pass(?:ing)? out|faint|black(?:ing|ed)? out|unconscious|chest pain|cannot breathe|can.?t breathe|choking now|short(?:ness)? of breath at rest|sudden weakness|seizure/.test(text)) return 'immediate';
  if (/\b(no|nope|nothing new|about usual|higher than usual|same as usual)\b/.test(text) && !/fall|\bfell|chok|breath|dizzy|weak|worsen|\bworse\b/.test(text)) return 'none';
  if (/breath|swallow|chok|\bfall\b|\bfell\b|worsen|\bworse\b|dizzy|weaker|couldn.?t feel|didn.?t feel|new symptom/.test(text)) return 'virtual';
  return 'none';
}

export function escalationLine(level: Escalation) {
  if (level === 'immediate') return immediateCare;
  if (level === 'virtual') return virtualCare;
  return '';
}

export function publicEscalation(level: Escalation) {
  return level === 'immediate' ? 'urgent' as const : level;
}

export function withEscalation(answer: string, level: Escalation) {
  const line = escalationLine(level);
  if (!line) return answer;
  if (answer.toLowerCase().includes(line.replace(/\.$/, '').toLowerCase())) return answer;
  return `${line} ${answer}`;
}

export const checkinInstructions = [
  'You are the daily check-in for Alex Chen. You are not a general assistant.',
  'Use the case only to know this check-in is for Alex Chen. Do not discuss measurements, diagnose, or answer any other question.',
  'Every visit, ask these questions in this order, one at a time. Do not skip, reword, or add a question. Do not give advice while the questions are still going.',
  ...checkinQuestions.map((question, index) => `${index + 1}. ${question}`),
  `Then say "${voiceNotePrompt}"`,
  `After the voice note, say one closing line and stop. Use "${inPersonClose}" for fainting, not being able to breathe, choking now, or shortness of breath at rest. Use "${consultClose}" for a fall or another new change. Otherwise say "${notedClose}"`,
].join('\n');

export const aliceInstructions = [
  'You are Alice. You are not a general assistant.',
  'Your only job is to summarize Alex Chen’s dashboard from the recorded facts supplied with this message.',
  'Summarize the latest recorded measures and the recent check-ins that are listed. Use only those facts.',
  'Do not diagnose, estimate a probability, or invent a number.',
  `If they are fainting, cannot breathe, are choking now, or suddenly much weaker, begin with "${immediateCare}"`,
  `If the facts or their question describe a fall, worse swallowing, breathing, speech, or another new change that is not an emergency, begin with "${virtualCare}"`,
  'Do not give any other advice.',
  'If the question asks for something that is not in the recorded facts, say it is not on the dashboard.',
  'Two or three plain sentences. No markdown.',
].join(' ');

type CheckinSession = { step: number; notes: string[]; closing?: string; escalation?: 'urgent' | 'virtual' | 'none' };
const sessions = new Map<string, CheckinSession>();
let checkinSeq = 0;

export function checkinClosing(notes: string[]) {
  const safety = (notes[2] || '').toLowerCase();
  const joined = notes.join(' ').toLowerCase();
  const safetyYes = /^(yes|yeah|yep)\b/.test(safety.trim()) && !/\b(no|nope)\b/.test(safety);
  if (/pass(?:ing)? out|faint|black(?:ing|ed)? out|unconscious|chest pain|cannot breathe|can.?t breathe|choking now|short(?:ness)? of breath at rest|sudden weakness|seizure/.test(joined) || (safetyYes && /breath|chok/.test(safety))) {
    return { say: inPersonClose, escalation: 'urgent' as const };
  }
  if (safetyYes || /\b(fall|fell)\b|worsen|\bworse\b|dizzy|weaker|trouble swallowing|new symptom/.test(joined)) {
    return { say: consultClose, escalation: 'virtual' as const };
  }
  return { say: notedClose, escalation: 'none' as const };
}

export function checkinTurn(transcript: string, threadId?: string) {
  const id = threadId || `checkin-${Date.now()}-${++checkinSeq}`;
  const session = sessions.get(id) ?? { step: 0, notes: [] };
  if (session.closing) return { say: session.closing, threadId: id, escalation: session.escalation || 'none', done: true, notes: session.notes };
  session.notes.push(transcript);
  session.step += 1;
  sessions.set(id, session);
  if (session.step < checkinQuestions.length) {
    return { say: checkinQuestions[session.step], threadId: id, escalation: 'none' as const, done: false };
  }
  if (session.step === checkinQuestions.length) {
    return { say: voiceNotePrompt, threadId: id, escalation: 'none' as const, done: false };
  }
  const closing = checkinClosing(session.notes);
  session.closing = closing.say;
  session.escalation = closing.escalation;
  return { say: closing.say, threadId: id, escalation: closing.escalation, done: true, notes: session.notes };
}
