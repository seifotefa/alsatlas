import { useEffect, useState } from 'react';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Play from 'lucide-react/dist/esm/icons/play';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Users from 'lucide-react/dist/esm/icons/users';

const api = '/api';

export function ResearchPlatform() {
  const [enabled, setEnabled] = useState(false);
  const [categories, setCategories] = useState({ questions: false, movement: false, voice: false });
  const [consultations, setConsultations] = useState(0);
  const [notice, setNotice] = useState('');
  const [request, setRequest] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${api}/patients/demo-alex-chen/consent`).then(response => response.json()),
      fetch(`${api}/research/consultations`).then(response => response.json()),
    ]).then(([consent, consultationData]) => {
      setEnabled(Boolean(consent.enabled));
      setCategories(consent.categories || {});
      setConsultations(Number(consultationData.completed || 0));
    }).catch(() => setNotice('Unable to load research status. Check the local API and reload.'));
  }, []);

  const saveConsent = async (nextEnabled = enabled, nextCategories = categories) => {
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch(`${api}/patients/demo-alex-chen/consent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled, categories: nextCategories }),
      });
      const data = await response.json();
      if (!response.ok || !data.saved) throw new Error();
      setEnabled(nextEnabled);
      setCategories(nextCategories);
      setNotice('Consent saved to the demo record.');
    } catch {
      setNotice('Consent could not be saved. Check the local API and try again.');
    } finally {
      setBusy(false);
    }
  };

  const recordConsultation = async () => {
    setBusy(true);
    setNotice('');
    try {
      const created = await fetch(`${api}/research/consultations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ researcherId: 'demo-researcher', patientId: 'demo-alex-chen', topic: 'Demo ALS care consultation' }),
      });
      const data = await created.json();
      if (!created.ok) throw new Error();
      const completed = await fetch(`${api}/research/consultations/${data.consultation.id}/complete`, { method: 'POST' });
      const result = await completed.json();
      if (!completed.ok) throw new Error();
      setConsultations(result.completed);
      setNotice('Consultation recorded in the demo exchange.');
    } catch {
      setNotice('Unable to record the consultation. Check the local API and try again.');
    } finally {
      setBusy(false);
    }
  };

  const unlocked = consultations >= 5;
  const items = [
    ['questions', 'Daily questions', 'Responses and function notes'],
    ['movement', 'Movement video', '15-second mobility samples'],
    ['voice', 'Voice samples', 'Short speech recordings'],
  ] as const;

  return <div className="page">
    <div className="page-intro">
      <span className="eyebrow">RESEARCH NETWORK</span>
      <h2>Contribute with clarity.<br/><em>Build access through care.</em></h2>
      <p className="lede">Patients choose what to share. Researchers earn governed access by contributing consultation time and expertise.</p>
    </div>
    <div className="research-layout">
      <section className="panel consent-panel">
        <header><div><span className="eyebrow">PATIENT CONSENT</span><h3>{enabled ? 'Contributing selected data' : 'Participation paused'}</h3></div><span className={`consent-state ${enabled ? 'on' : ''}`}><i/>{enabled ? 'Active' : 'Paused'}</span></header>
        <p>Change categories at any time. Product access is never affected.</p>
        <div className="consent-list">{items.map(([key, name, detail]) => <label key={key}><span><b>{name}</b><small>{detail}</small></span><input type="checkbox" checked={Boolean(categories[key])} disabled={!enabled || busy} onChange={() => saveConsent(enabled, { ...categories, [key]: !categories[key] })}/><i/></label>)}</div>
        <div className="consent-actions"><button className={`btn secondary${busy ? ' is-loading' : ''}`} disabled={busy} onClick={() => saveConsent(!enabled, enabled ? categories : { questions: true, movement: true, voice: false })}>{enabled ? <><Pause size={15}/>Pause future contributions</> : <><Play size={15}/>Start contributing</>}</button>{enabled && <button className="text-action" disabled={busy} onClick={() => saveConsent(false, { questions: false, movement: false, voice: false })}>Withdraw future contributions</button>}</div>
      </section>
      <aside className="panel research-status">
        <span className="eyebrow">RESEARCHER PORTAL · DEMO</span><h3>Earn access through care.</h3>
        <p className="lede">Researchers can offer virtual consultations to participating clients. This demo tracks the exchange without granting real-world data access.</p>
        <div className="unlock-meter"><strong>{consultations} / 5 consultations</strong><div><i style={{ width: `${Math.min(consultations / 5 * 100, 100)}%` }}/></div><small>{unlocked ? 'Research metrics unlocked' : 'Complete five consultations to unlock the synthetic metrics catalogue'}</small></div>
        <button className={`btn secondary${busy ? ' is-loading' : ''}`} disabled={busy} onClick={recordConsultation}><Users size={15}/>Record consultation</button>
      </aside>
    </div>
    {notice && <div className="inline-notice" role="status">{notice}</div>}
    <section className="panel dataset-panel">
      <header><div><span className="eyebrow">DATA CATALOGUE · SYNTHETIC</span><h3>{unlocked ? 'Research metrics unlocked' : 'Research access preview'}</h3></div><span className="soft-tag"><ShieldCheck size={13}/> Governed access</span></header>
      <div className="research-cards">
        <article><span className="eyebrow">LONGITUDINAL FUNCTION</span><strong>{unlocked ? '1,284' : 'Preview'}</strong><small>{unlocked ? 'synthetic observations available' : 'Locked until consultation commitment is met'}</small></article>
        <article><span className="eyebrow">SPEECH + MOVEMENT</span><strong>{unlocked ? '642' : 'Preview'}</strong><small>{unlocked ? 'consented sample summaries' : 'De-identified sample summaries'}</small></article>
        <article><span className="eyebrow">ACCESS REQUEST</span><strong>{request || 'Not requested'}</strong><small><button className="table-link" onClick={() => { setRequest(unlocked ? 'Under review' : 'Requirements shown'); setNotice(unlocked ? 'Dataset access request submitted for demo review.' : 'Complete five consultations before requesting access.'); }}>{unlocked ? 'Request dataset access' : 'View requirements'}</button></small></article>
      </div>
    </section>
  </div>;
}
