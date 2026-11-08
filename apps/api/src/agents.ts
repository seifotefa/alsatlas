export const checkinQuestions = [
  'How is Alex’s energy today: lower than usual, about usual, or higher than usual?',
  'What has changed since the last check-in: speech, swallowing, breathing, walking, hands, or nothing new?',
  'Did a fall, choking, or shortness of breath at rest happen?',
  'Record a short video of a comfortable walk. Stop if it feels unsafe.',
];

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
  'Every visit, ask these questions in this order, one at a time. Do not skip, reword, or add a question.',
  ...checkinQuestions.map((question, index) => `${index + 1}. ${question}`),
  `If they are fainting, cannot breathe, are choking now, or suddenly much weaker, say "${immediateCare}" and stop.`,
  `If they report a fall, choking, worse swallowing, breathing, speech, or a new change that is not an emergency, say "${virtualCare}" and then ask the next question.`,
  'After the video instruction, stop. If they ask anything else, repeat the current question.',
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

const progress = new Map<string, number>();

export function checkinTurn(transcript: string, threadId?: string) {
  const id = threadId || `checkin-${Date.now()}`;
  const level = escalationFor(transcript);
  const index = Math.min(progress.get(id) ?? 1, checkinQuestions.length - 1);
  progress.set(id, Math.min(index + 1, checkinQuestions.length));
  const line = escalationLine(level);
  if (level === 'immediate') return { say: line, threadId: id, escalation: 'urgent' as const };
  const say = line ? `${line} ${checkinQuestions[index]}` : checkinQuestions[index];
  return { say, threadId: id, escalation: level === 'virtual' ? 'virtual' as const : 'none' as const };
}
