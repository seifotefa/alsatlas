import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type SeriesPoint = { month: number; value: number; date?: string | null };

type Measurement = {
  type: string;
  value?: number;
  unit?: string;
  date?: string;
  months_since_symptom_onset?: number;
  position?: string;
  time?: string;
};

const onset = new Date('2024-06-01T00:00:00Z');
const casePath = path.join(fileURLToPath(new URL('../../../', import.meta.url)), 'data/demo/alex_chen.json');

export function monthSinceOnset(date?: string | null) {
  if (!date) return null;
  const parsed = new Date(date.length === 7 ? `${date}-01T00:00:00Z` : date);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, (parsed.getUTCFullYear() - onset.getUTCFullYear()) * 12 + (parsed.getUTCMonth() - onset.getUTCMonth()));
}

export function loadCaseRecord() {
  const record = JSON.parse(readFileSync(casePath, 'utf8')) as { fictional: boolean; measurements: Measurement[] };
  const measurements = record.measurements;
  const alsfrs = measurements
    .filter(item => item.type === 'ALSFRS-R' && typeof item.value === 'number')
    .map(item => ({ month: Number(item.months_since_symptom_onset ?? monthSinceOnset(item.date) ?? 0), value: Number(item.value), date: item.date ?? null }));
  const sitting = measurements.filter(item => item.type === 'forced_vital_capacity' && item.position === 'sitting' && typeof item.value === 'number');
  const speech = measurements.filter(item => item.type === 'sentence_intelligibility' && typeof item.value === 'number');
  const weight = measurements.filter(item => item.type === 'weight' && typeof item.value === 'number');
  const nerve = measurements.filter(item => item.type === 'nerve_control' && typeof item.value === 'number');
  const latestAlsfrs = measurements.filter(item => item.type === 'ALSFRS-R').at(-1) as (Measurement & { subscores?: Record<string, number> }) | undefined;
  return {
    source: 'data/demo/alex_chen.json',
    fictional: record.fictional === true,
    measurementCount: measurements.length,
    alsfrs,
    latest: {
      fvcSitting: sitting.at(-1)?.value ?? null,
      fvcSupine: measurements.filter(item => item.type === 'forced_vital_capacity' && item.position === 'supine').at(-1)?.value ?? null,
      speechMorning: [...speech].reverse().find(item => item.time === '09:00')?.value ?? null,
      speechAfternoon: [...speech].reverse().find(item => item.time === '16:00')?.value ?? speech.at(-1)?.value ?? null,
      weightKg: weight.at(-1)?.value ?? null,
    },
    sittingFvc: sitting.map(item => ({ month: Number(item.months_since_symptom_onset ?? monthSinceOnset(item.date) ?? 0), value: Number(item.value), date: item.date ?? null })),
    speechClarity: speech.filter(item => item.time !== '09:00').map(item => ({ month: Number(item.months_since_symptom_onset ?? monthSinceOnset(item.date) ?? 0), value: Number(item.value), date: item.date ?? null })),
    nerveControl: nerve.map(item => ({ month: Number(item.months_since_symptom_onset ?? monthSinceOnset(item.date) ?? 0), value: Number(item.value), date: item.date ?? null })),
    alsfrsSubscores: latestAlsfrs?.subscores ?? null,
  };
}

function spanFact(label: string, points: SeriesPoint[], fromMonth: number, toMonth: number) {
  const sorted = [...points].sort((a, b) => a.month - b.month);
  const from = sorted.find(point => point.month === fromMonth);
  const to = sorted.find(point => point.month === toMonth);
  if (!from || !to) return null;
  const lost = from.value - to.value;
  return `${label} from month ${fromMonth} to month ${toMonth}: ${from.value} to ${to.value}, ${lost} points lost.`;
}

export function caseFacts() {
  const record = loadCaseRecord();
  const latestAlsfrs = [...record.alsfrs].sort((a, b) => a.month - b.month).at(-1);
  const nerve = [...record.nerveControl].sort((a, b) => a.month - b.month);
  const nerveStart = nerve.find(point => point.month === 3);
  const nerveMid = nerve.find(point => point.month === 15);
  const nerveNow = nerve.find(point => point.month === 27);
  const subscores = record.alsfrsSubscores;
  return [
    'Patient: Alex Chen. Answer only with numbers from these facts. If a number is not listed, say it was not recorded.',
    latestAlsfrs ? `ALSFRS-R latest: ${latestAlsfrs.value} out of 48 at month ${latestAlsfrs.month}${latestAlsfrs.date ? `, ${latestAlsfrs.date}` : ''}.` : 'ALSFRS-R: not recorded.',
    subscores ? `ALSFRS-R subscores at the latest visit, each out of 12: bulbar ${subscores.bulbar}, fine motor ${subscores.fine_motor}, gross motor ${subscores.gross_motor}, breathing ${subscores.breathing}.` : '',
    spanFact('ALSFRS-R', record.alsfrs, 0, 12),
    spanFact('ALSFRS-R', record.alsfrs, 12, 24),
    spanFact('ALSFRS-R', record.alsfrs, 24, 27),
    'ALSFRS-R yearly loss slowed from 9 points in the first year to 6 points in the second year. The last 3 months lost 1 point.',
    nerveStart && nerveMid && nerveNow ? `Nerve control is a 0 to 100 score. Higher means more preserved nerve control. ${nerveStart.date}: ${nerveStart.value}. ${nerveMid.date}: ${nerveMid.value}, which is ${nerveStart.value - nerveMid.value} points lost that year. ${nerveNow.date}: ${nerveNow.value}, which is ${nerveMid.value - nerveNow.value} points lost in the latest year. Current score is ${nerveNow.value}. The yearly loss slowed from ${nerveStart.value - nerveMid.value} points to ${nerveMid.value - nerveNow.value} points.` : '',
    `Sitting FVC latest: ${record.latest.fvcSitting ?? 'not recorded'} percent. Supine FVC latest: ${record.latest.fvcSupine ?? 'not recorded'} percent.`,
    `Speech clarity morning: ${record.latest.speechMorning ?? 'not recorded'} percent. Speech clarity afternoon: ${record.latest.speechAfternoon ?? 'not recorded'} percent.`,
    `Weight latest: ${record.latest.weightKg ?? 'not recorded'} kg.`,
  ].filter((fact): fact is string => Boolean(fact));
}

function byMonth(points: SeriesPoint[]) {
  const grouped = new Map<number, SeriesPoint>();
  for (const point of [...points].sort((a, b) => a.month - b.month)) grouped.set(point.month, point);
  return [...grouped.values()];
}

export function buildSeries(checkins: { createdAt?: string; energy?: number }[]) {
  const record = loadCaseRecord();
  const file = JSON.parse(readFileSync(casePath, 'utf8')) as { measurements: Measurement[] };
  const recordedEnergy = file.measurements
    .filter(item => item.type === 'daily_energy' && typeof item.value === 'number')
    .map(item => ({ month: Number(item.months_since_symptom_onset ?? monthSinceOnset(item.date) ?? 0), value: Number(item.value), date: item.date ?? null }));
  const lastRecorded = recordedEnergy.at(-1)?.month ?? -1;
  const laterCheckins = checkins
    .filter(item => typeof item.energy === 'number' && (monthSinceOnset(item.createdAt) ?? 0) > lastRecorded)
    .map(item => ({ month: monthSinceOnset(item.createdAt) ?? 0, value: Number(item.energy), date: item.createdAt ?? null }));
  return {
    record,
    series: {
      'ALSFRS-R': byMonth(record.alsfrs),
      'Sitting FVC': byMonth(record.sittingFvc),
      'Speech clarity': byMonth(record.speechClarity),
      'Nerve control': byMonth(record.nerveControl),
      'Daily energy': byMonth([...recordedEnergy, ...laterCheckins]),
    } as Record<string, SeriesPoint[]>,
  };
}
