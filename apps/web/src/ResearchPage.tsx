import { useEffect, useState } from 'react';
import { ArrowRight, Check, Pause, Play, ShieldCheck } from 'lucide-react';
const USER = 'demo-alex-chen';
type Categories = { questions: boolean; movement: boolean; voice: boolean };
type Reward = {
  txStatus?: 'submitted' | 'confirmed' | 'failed';
  txSignature?: string | null;
  explorerUrl?: string | null;
  amountLamports?: number;
  recipientAddress?: string | null;
  error?: string | null;
  confirmedAt?: string | null;
};
type Participation = {
  storage?: 'file' | 'tiger-data' | 'memory';
  consent: { status: 'granted' | 'withdrawn'; categories: Categories } | null;
  contribution: { id: string; reviewStatus: 'submitted' | 'approved'; reviewNote: string | null; categories: Categories } | null;
  reward: Reward | null;
  rewardLamports: number;
  eligible?: boolean;
};
const emptyCategories: Categories = { questions: true, movement: true, voice: false };

async function send(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(typeof payload.error === 'string' ? payload.error : 'Request failed') as Error & { payload?: Reward & { error?: string } };
    error.payload = payload;
    throw error;
  }
  return payload;
}

export function ResearchPage({ detailsOnly = false }: { detailsOnly?: boolean } = {}) {
  const [categories, setCategories] = useState<Categories>(emptyCategories);
  const [enabled, setEnabled] = useState(true);
  const [consentChecked, setConsentChecked] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [participation, setParticipation] = useState<Participation | null>(null);

  const load = async () => {
    const next = await send(`/api/research/participation?userRef=${USER}`) as Participation;
    setParticipation(next);
    if (next.consent?.status === 'granted') {
      setCategories(next.consent.categories);
      setConsentChecked(true);
      setEnabled(true);
    }
  };

  useEffect(() => { load().catch(() => setError('The research record could not be loaded.')); }, []);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setError('');
    try {
      await action();
      setNotice(success);
      await load();
    } catch (caught) {
      const payload = caught as Error & { payload?: Reward };
      setError(payload.message);
      if (payload.payload?.txSignature) await load().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const contribution = participation?.contribution ?? null;
  const reward = participation?.reward ?? null;
  const consentLabel = !enabled || participation?.consent?.status === 'withdrawn' ? 'Participation paused' : participation?.consent?.status === 'granted' ? 'Contributing selected data' : 'Consent not saved';
  const rewardStatus = !contribution ? 'No contribution yet' : contribution.reviewStatus === 'submitted' ? 'Waiting for review' : reward?.txStatus === 'confirmed' ? 'Transaction confirmed' : reward?.txStatus === 'submitted' ? 'Transaction submitted, waiting for confirmation' : reward?.txStatus === 'failed' ? 'Transaction failed' : 'Approved for a reward';

  return <div className="page">{!detailsOnly && <div className="page-intro"><span className="eyebrow">Research network</span><h2>Contribute with clarity.<br/><em>Keep your choices visible.</em></h2><p className="lede">Patients can voluntarily contribute governed, de-identified longitudinal data. Participation is optional and never affects care tools.</p></div>}
    {!detailsOnly && <div className="research-layout"><section className="panel consent-panel"><header><div><span className="eyebrow">Current consent</span><h3>{consentLabel}</h3></div><span className={`consent-state ${participation?.consent?.status === 'granted' && enabled ? 'on' : ''}`}><i/>{participation?.consent?.status === 'granted' && enabled ? 'Active' : 'Paused'}</span></header>
      <p>Review the categories, then save a separate research consent. Care features stay available either way.</p>
      <div className="consent-list">{([['questions', 'Daily questions', 'Responses and function notes'], ['movement', 'Movement video', '15-second mobility samples'], ['voice', 'Voice samples', 'Short speech recordings']] as const).map(([key, name, detail]) => <label key={key}><span><b>{name}</b><small>{detail}</small></span><input type="checkbox" checked={categories[key]} disabled={!enabled || Boolean(contribution)} onChange={() => setCategories({ ...categories, [key]: !categories[key] })}/><i/></label>)}</div>
      <label className="check-row"><input type="checkbox" checked={consentChecked} disabled={!enabled || Boolean(contribution)} onChange={(event) => setConsentChecked(event.target.checked)}/><span>I consent to contribute these categories for approved research.</span></label>
      <div className="consent-actions"><button className="btn secondary" type="button" disabled={busy || !enabled || Boolean(contribution)} onClick={() => run(() => send('/api/research/consent', { userRef: USER, consent: true, categories }), 'Research consent saved.')}>Save research consent</button><button className="btn" type="button" disabled={busy || !enabled || !consentChecked || Boolean(contribution)} onClick={() => run(async () => { await send('/api/research/consent', { userRef: USER, consent: true, categories }); await send('/api/research/contributions', { userRef: USER, consent: true, synthetic: true, categories }); }, 'Contribution submitted for review.')}>Submit contribution <ArrowRight size={15}/></button></div>
      <div className="consent-actions"><button className="btn secondary" type="button" onClick={() => { setEnabled(!enabled); setNotice(enabled ? 'Future contributions paused in this session.' : 'Participation resumed in this session.'); }}>{enabled ? <><Pause size={15}/>Pause future contributions</> : <><Play size={15}/>Resume participation</>}</button><button className="text-action" type="button" onClick={() => run(async () => { setEnabled(false); setConsentChecked(false); setCategories({ questions: false, movement: false, voice: false }); await send('/api/research/consent', { userRef: USER, consent: false, categories: { questions: false, movement: false, voice: false } }); }, 'Future contributions withdrawn.')}>Withdraw future contributions</button></div>
      {notice && <div className="inline-notice" role="status">{notice}</div>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </section>
    <aside className="panel research-status"><span className="eyebrow">Data journey</span><h3>From contribution to approved use</h3>
      {[['01', 'Your choice', 'Explicit consent, by category.'], ['02', 'Administrative review', 'Review before research access.'], ['03', 'Devnet reward', 'A fixed SOL transfer after approval.']].map(([n, title, detail], index) => <div className="journey-row" key={n}><b>{n}</b><span><strong>{title}</strong><small>{detail}</small></span><i className={index === 0 && participation?.consent?.status === 'granted' ? 'done' : ''}>{index === 0 && participation?.consent?.status === 'granted' ? <Check size={12}/> : index + 1}</i></div>)}
      <div className="review-queue"><span className="eyebrow">Review status</span><b>{rewardStatus}</b>{contribution?.reviewNote && <small>{contribution.reviewNote}</small>}<span>{participation?.storage === 'tiger-data' ? 'Record stored in Tiger Data' : 'Record stored with the Atlas server'}</span><span className={reward?.txStatus === 'confirmed' ? 'status-ok' : reward?.txStatus === 'failed' ? 'status-bad' : 'pending'}>{rewardStatus}</span>{contribution?.reviewStatus === 'submitted' && <button className="btn secondary" type="button" disabled={busy} onClick={() => run(() => send(`/api/research/contributions/${contribution.id}/approve`, { administrativeDemoApproval: true }), 'Marked approved for a reward.')}>Approve reward</button>}</div>
    </aside></div>}
    {detailsOnly && notice && <p className="inline-notice" role="status">{notice}</p>}
    {detailsOnly && error && <p className="field-error" role="alert">{error}</p>}
    <section className="panel dataset-panel"><header><div><span className="eyebrow">Research catalogue</span><h3>Available to approved researchers</h3></div><span className="soft-tag"><ShieldCheck size={13}/> Governed access</span></header><div className="dataset-table"><div className="table-head"><span>Dataset</span><span>Coverage</span><span>Provenance</span><span>Access</span></div>{[['Longitudinal function', 'De-identified records', 'Patient-owned · reviewed'], ['Speech and movement', 'Consented samples', 'Reviewed samples'], ['Caregiver context', 'Structured observations', 'Reviewed, no raw identity']].map((row) => <div className="table-row" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}<button className="table-link" type="button" onClick={() => setNotice(`${row[0]} access request recorded.`)}>Request access</button></div>)}</div></section>
    <section className="panel rewards-panel" aria-labelledby="research-rewards-title"><header><div><span className="eyebrow">Research rewards</span><h3 id="research-rewards-title">Solana reward</h3></div></header>
      <p className="reward-disclaimer">A fixed Solana transfer after review.</p>
      <p>It is not payment for medical data.</p>
    </section></div>;
}
