import { caseFacts } from './case-record.js';

function escapePdf(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrap(value: string, width = 86) {
  const words = value.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line || !lines.length) lines.push(line);
  return lines;
}

export function progressionPdf() {
  const lines = [
    'ALS Atlas progression summary',
    'Patient: Alex Chen',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    'Recorded change over 27 months, from June 2024 through September 2026.',
    ...caseFacts().filter(fact => !fact.startsWith('Patient: Alex Chen. Answer only')).flatMap(fact => wrap(fact)),
    '',
    'This summary organizes recorded measurements for a clinician visit.',
    'It is not a diagnosis and does not replace clinical care.',
  ];
  const stream = ['BT', '/F1 12 Tf', '72 740 Td', '16 TL', ...lines.flatMap((line, index) => [`(${escapePdf(line)}) Tj`, ...(index < lines.length - 1 ? ['T*'] : [])]), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) body += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body);
}
