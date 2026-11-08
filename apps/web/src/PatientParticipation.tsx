import { useEffect, useState } from 'react';
import './patient-participation.css';

type Consent = { enabled?: boolean; categories?: { questions?: boolean; movement?: boolean; voice?: boolean } };

export function PatientParticipation() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    const [consentResponse, checkinResponse] = await Promise.all([
      fetch('/api/patients/demo-alex-chen/consent'),
      fetch('/api/checkins'),
    ]);
    setConsent(await consentResponse.json());
    const checkins = await checkinResponse.json().catch(() => ({ checkins: [] }));
    setPoints(Array.isArray(checkins.checkins) ? checkins.checkins.length : 0);
  };

  useEffect(() => { load().catch(() => setNotice('The participation record could not be loaded.')); }, []);

  const save = async (next: Consent) => {
    setSaving(true);
    setConsent(next);
    try {
      const response = await fetch('/api/patients/demo-alex-chen/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(next),
      });
      setConsent(await response.json());
      setNotice(next.enabled ? 'Consent saved' : 'Future contributions paused');
    } catch {
      setNotice('Consent could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    ['questions', 'Daily questions'],
    ['movement', 'Movement samples'],
    ['voice', 'Voice samples'],
  ] as const;
  const earned = points ?? 0;

  return <div className="earn">
    <p className="earn-figure">${points === null ? '—' : earned}<span> earned</span></p>
    <p className="earn-count">{points === null ? 'Counting data points' : `${earned} data points contributed`}</p>
    <p className="earn-rate">$1 per accepted point</p>
    <section>
      <header>
        <h2>{consent?.enabled ? 'Consent on' : 'Consent off'}</h2>
        <button type="button" disabled={saving || !consent} onClick={() => consent && save({ ...consent, enabled: !consent.enabled })}>{consent?.enabled ? 'Pause' : 'Turn on'}</button>
      </header>
      {categories.map(([key, label]) => <label key={key}>
        <span>{label}</span>
        <input type="checkbox" checked={Boolean(consent?.categories?.[key])} disabled={!consent?.enabled || saving} onChange={() => consent && save({ ...consent, categories: { ...consent.categories, [key]: !consent.categories?.[key] } })}/>
      </label>)}
      <button className="withdraw" type="button" disabled={saving || !consent} onClick={() => consent && save({ ...consent, enabled: false, categories: { questions: false, movement: false, voice: false } })}>Withdraw future contributions</button>
    </section>
    {notice && <p className="earn-note" role="status">{notice}</p>}
  </div>;
}
