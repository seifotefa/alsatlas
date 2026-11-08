import { useState, type FormEvent, type ReactNode } from 'react';
import Activity from 'lucide-react/dist/esm/icons/activity';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import AudioLines from 'lucide-react/dist/esm/icons/audio-lines';
import ChartColumn from 'lucide-react/dist/esm/icons/chart-column';
import Check from 'lucide-react/dist/esm/icons/check';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import FlaskConical from 'lucide-react/dist/esm/icons/flask-conical';
import HeartPulse from 'lucide-react/dist/esm/icons/heart-pulse';
import Layers from 'lucide-react/dist/esm/icons/layers';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import PersonStanding from 'lucide-react/dist/esm/icons/person-standing';
import Search from 'lucide-react/dist/esm/icons/search';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Users from 'lucide-react/dist/esm/icons/users';
import Video from 'lucide-react/dist/esm/icons/video';
import Wind from 'lucide-react/dist/esm/icons/wind';
import mark from './assets/mark.png';
import './landing.css';

export type Page = 'home' | 'product' | 'diagnosis' | 'research';
type Go = (view: 'home' | 'product' | 'diagnosis' | 'network' | 'survey' | 'dashboard' | 'research' | 'researcher', tab?: 'overview' | 'checkin' | 'progress' | 'referral' | 'research' | 'care' | 'assistant') => void;

export function LandingPage({ page, go }: { page: Page; go: Go }) {
  return <div className="marketing">
    <SiteNav page={page} go={go}/>
    {page === 'home' && <Home go={go}/>}
    {page === 'product' && <Product go={go}/>}
    {page === 'diagnosis' && <Diagnosis/>}
    {page === 'research' && <ResearchLanding go={go}/>}
  </div>;
}

function SiteNav({ page, go }: { page: Page; go: Go }) {
  const item = (id: Page, label: string, view: 'product' | 'diagnosis' | 'network') =>
    <button className={page === id ? 'on' : ''} aria-current={page === id ? 'page' : undefined} onClick={() => go(view)}>{label}</button>;
  return <header className="marketing-nav">
    <button className="marketing-logo" onClick={() => go('home')} aria-label="ALS Atlas home"><img src={mark} alt=""/></button>
    <nav aria-label="Site">
      {item('product', 'Product', 'product')}
      {item('diagnosis', 'Diagnosis', 'diagnosis')}
      {item('research', 'Research', 'network')}
    </nav>
    <button className="pill dark" onClick={() => go('dashboard')}>Open care <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true"/></button>
  </header>;
}

function Home({ go }: { go: Go }) {
  return <main className="home-main">
    <section className="marketing-hero">
      <h1>A clearer ALS journey</h1>
      <p>From early recognition to ongoing care and research, ALS Atlas helps patients, caregivers, and clinicians stay aligned.</p>
      <div className="marketing-actions">
        <button className="pill dark" onClick={() => go('dashboard')}>Open care <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true"/></button>
        <button className="pill light" onClick={() => go('product')}>See the workspace</button>
      </div>
    </section>
    <MacBook label="Care workspace on a laptop"><CareScreen/></MacBook>
  </main>;
}

function Product({ go }: { go: Go }) {
  return <main className="subpage">
    <header className="page-lead">
      <p className="kicker">Product</p>
      <h1>The workspace, one surface at a time</h1>
      <p>The same record you saw on the home page. Here is what each part of it is for.</p>
    </header>
    <Feature
      eyebrow="Overview"
      title="The day, before the appointment"
      copy="ALSFRS-R, sitting FVC, speech clarity, and the next visit sit on one screen. The caregiver opens this and knows what is current."
    >
      <div className="slice metrics">
        <article><small>ALSFRS-R</small><strong>32 / 48</strong></article>
        <article><small>Sitting FVC</small><strong>76%</strong></article>
        <article><small>Speech clarity</small><strong>91%</strong></article>
      </div>
    </Feature>
    <Feature
      flip
      eyebrow="Daily check-in"
      title="Spoken, then saved to the timeline"
      copy="Alice asks what changed. Dizziness, a weaker arm, energy after 4 PM. The caregiver answers out loud, confirms the note, and the visit record updates."
    >
      <div className="slice talk">
        <div className="bubble alice"><small>Alice</small>What felt different today?</div>
        <div className="bubble you">A little dizzy, and the right arm was weaker.</div>
        <div className="bubble alice"><small>Alice</small>I’ll log dizziness and right-arm weakness. Say “save it” when this looks right.</div>
        <div className="saved"><ShieldCheck size={16} strokeWidth={1.5}/> Saved to today’s timeline</div>
      </div>
    </Feature>
    <Feature
      eyebrow="Progress"
      title="Six visits, not a drawing"
      copy="The line is the recorded ALSFRS-R series, from the case file plus each check-in that was actually saved. Range and measure can change without leaving the page."
    >
      <div className="slice chart">
        <div><b>ALSFRS-R</b><span>Jun 2024 — Sep 2026</span></div>
        <svg viewBox="0 0 360 120" role="img" aria-label="ALSFRS-R across six visits">
          <line x1="8" y1="24" x2="348" y2="24"/><line x1="8" y1="58" x2="348" y2="58"/><line x1="8" y1="92" x2="348" y2="92"/>
          <path d="M16 22 C70 30 100 42 150 54 S230 74 280 86 S320 96 344 100" fill="none" stroke="#1d4ed8" strokeWidth="2"/>
          {[[16,22],[78,36],[150,54],[214,70],[286,88]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="#6b7487"/>)}
          <circle cx="344" cy="100" r="4" fill="#fff" stroke="#1d4ed8" strokeWidth="2"/>
        </svg>
      </div>
    </Feature>
    <Feature
      flip
      eyebrow="Referral and care team"
      title="What you bring, and who can see it"
      copy="A referral summary pulls the recorded facts into a PDF for the clinician. The care circle decides who sees the timeline. Research sharing stays a separate switch."
    >
      <div className="slice people">
        {[['JC','Jordan Chen','Primary caregiver','Full timeline'],['MC','Maya Chen','Family','Check-ins'],['HW','Dr. Hannah Weiss','Neurology','Shared summary']].map(([ini,name,role,access]) =>
          <div key={name}><b>{ini}</b><span><strong>{name}</strong><small>{role}</small></span><em>{access}</em></div>)}
      </div>
    </Feature>
    <DashboardLink label="Open care dashboard" onClick={() => go('dashboard')}/>
  </main>;
}

const referralGroups = [
  ['Course', [
    ['progression', 'Getting worse over time, in one area or spreading'],
    ['asymmetry', 'Worse on one side than the other'],
  ]],
  ['Breathing', [
    ['breathExertion', 'Shortness of breath with exertion or daily activities'],
    ['orthopnea', 'Shortness of breath when lying down'],
  ]],
  ['Upper body', [
    ['handwriting', 'Handwriting has become harder'],
    ['lifting', 'Difficulty lifting, reaching, or carrying'],
    ['everydayTasks', 'Everyday tasks are harder: food, keys, jars, starting the car, coins'],
    ['dressing', 'Dressing or hygiene is harder: buttons, fingernails'],
  ]],
  ['Lower body', [
    ['tripping', 'Frequent tripping'],
    ['stairs', 'Difficulty on stairs, getting out of a chair, or standing on toes'],
    ['footDrag', 'The foot drags, or walking distance has fallen'],
  ]],
  ['Head and neck', [
    ['emotionalLability', 'Emotional outbursts that are hard to control'],
    ['slurredSpeech', 'Slurred speech'],
    ['swallowing', 'Difficulty swallowing'],
    ['excessSaliva', 'Excess saliva'],
  ]],
  ['Also listed on the tool', [
    ['cognitiveSymptoms', 'Thinking or behavior changes, along with weakness or trouble walking'],
    ['motorNeuronSigns', 'A clinician has found upper or lower motor neuron signs'],
    ['failureToThrive', 'Unexplained loss of weight, strength, or day-to-day function'],
    ['patientSuspectsAls', 'This person suspects ALS'],
  ]],
  ['Pain and feeling', [
    ['pain', 'Pain along with the weakness'],
    ['sensoryLoss', 'Numbness or loss of feeling'],
  ]],
] as const;

type ReferralKey = (typeof referralGroups)[number][1][number][0];
type Tri = 'yes' | 'no' | 'unknown';
type ReferralReview = {
  matchedImmediateIndicators?: { label: string }[];
  matchedConsiderIndicators?: { label: string }[];
  partiallyDocumentedIndicators?: { label: string }[];
  clinicianReviewRequired?: { label: string }[];
  reportedChanges?: string[];
  cautions?: string[];
};

function referralVerdict(review: ReferralReview) {
  const immediate = review.matchedImmediateIndicators ?? [];
  const needsReview = review.clinicianReviewRequired ?? [];
  const consider = review.matchedConsiderIndicators ?? [];
  const partial = review.partiallyDocumentedIndicators ?? [];
  const reported = review.reportedChanges ?? [];
  const cautions = review.cautions ?? [];
  const caution = cautions.length ? ` Also reported: ${cautions.join('; ')}. The tool notes that pain and sensory loss can point toward other explanations, such as a nerve compression.` : '';
  if (immediate.length || needsReview.length) return {
    title: 'See a doctor',
    copy: `These answers match the ReferALS reasons to refer. This is not a diagnosis.${caution}`,
    items: [...new Set([...immediate, ...needsReview].map(item => item.label).concat(reported))],
  };
  if (consider.length || partial.length || reported.length) return {
    title: 'Talk with a doctor',
    copy: `A clinician should review these changes. This does not confirm or rule out ALS.${caution}`,
    items: reported.length ? reported : [...consider, ...partial].map(item => item.label),
  };
  return {
    title: 'No referral from these answers',
    copy: `Nothing reported here matches a ReferALS indicator. A doctor can still look if something is changing. This is not a rule-out.${caution}`,
    items: cautions,
  };
}

function ReferralSurvey() {
  const [answers, setAnswers] = useState<Partial<Record<ReferralKey, Tri>>>({});
  const [review, setReview] = useState<ReferralReview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = referralGroups.every(([, questions]) => questions.every(([key]) => answers[key]));
  const verdict = review ? referralVerdict(review) : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/referals/evaluate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intake: answers }),
      });
      if (!response.ok) throw new Error();
      setReview(await response.json());
    } catch {
      setError('The referral check could not be completed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="referral-tool" aria-label="Referral survey">
    <form onSubmit={submit}>
      {referralGroups.map(([group, questions]) => <div className="referral-group" key={group}>
        <h3>{group}</h3>
        {questions.map(([key, label]) => <fieldset key={key}>
          <legend>{label}</legend>
          <div className="tri" role="radiogroup" aria-label={label}>
            {([['yes', 'Yes'], ['no', 'No'], ['unknown', 'Not sure']] as const).map(([value, text]) =>
              <button key={value} type="button" role="radio" aria-checked={answers[key] === value} className={answers[key] === value ? 'on' : ''} onClick={() => { setAnswers(current => ({ ...current, [key]: value })); setReview(null); }}>{text}</button>)}
          </div>
        </fieldset>)}
      </div>)}
      {error && <p className="referral-error" role="alert">{error}</p>}
      <button className="pill dark" type="submit" disabled={!ready || busy}>{busy ? 'Checking…' : 'Check referral'}</button>
    </form>
    <aside className="referral-result" aria-live="polite">
      {verdict ? <>
        <h2>{verdict.title}</h2>
        <p>{verdict.copy}</p>
        {verdict.items.length > 0 && <ul>{verdict.items.map(item => <li key={item}>{item}</li>)}</ul>}
      </> : <>
        <h2>Should this person see a doctor?</h2>
        <p>Answer each item from the ReferALS symptom list. The result says whether to refer.</p>
      </>}
      <p className="referral-safety">Severe breathing trouble, choking, or sudden weakness needs urgent care.</p>
    </aside>
  </section>;
}

function Diagnosis() {
  return <main className="subpage">
    <header className="page-lead">
      <p className="kicker">Referral</p>
      <h1>Should they see a doctor?</h1>
      <p>For someone who suspects a problem, or for a patient already being followed. The questions are the symptom list in the <a href="https://als.ca/wp-content/uploads/2024/05/ReferALS-Early-Referral-Tool.pdf" target="_blank" rel="noreferrer">ALS Canada ReferALS Early Referral Tool</a>. The result is whether to refer. It does not diagnose ALS.</p>
    </header>
    <ReferralSurvey/>
  </main>;
}

function ResearchLanding({ go }: { go: Go }) {
  const points = [[18, 118], [78, 104], [138, 90], [198, 74], [258, 52], [318, 28]];
  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');
  const steps = [
    [Users, 'Contribute', 'Patients, researchers, and clinicians add data'],
    [Layers, 'Aggregate', 'Longitudinal data grows with each contribution'],
    [Sparkles, 'Learn', 'New insights improve care and research'],
    [ChartColumn, 'Impact', 'Better detection, monitoring, and treatment'],
  ] as const;
  return <main className="network">
    <section className="network-hero">
      <div className="network-copy">
        <p className="network-kicker">Research network</p>
        <h1>A self-improving dataset for ALS.</h1>
        <p>A consent-based network where patients, researchers, and clinicians contribute to a growing, longitudinal dataset that advances ALS care.</p>
        <ul>
          {['Patient-driven and consent-first', 'Longitudinal, real-world observations', 'Contributions from researchers and clinicians'].map(item => <li key={item}><Check size={16} strokeWidth={2.25} aria-hidden="true"/>{item}</li>)}
        </ul>
        <button className="pill dark" onClick={() => go('researcher')}>Explore the network <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true"/></button>
      </div>
      <section className="network-panel" aria-label="ALS Research Network">
        <header>
          <span className="network-mark" aria-hidden="true"><Layers size={16} strokeWidth={1.75}/></span>
          <div><b>ALS Research Network</b><small>A growing, consent-based dataset</small></div>
          <em><i/>Actively growing</em>
        </header>
        <div className="network-stats">
          {[['Contributors', '1,284', '+12%'], ['Observations', '48,392', '+18%'], ['Research projects', '14', '+3']].map(([label, value, delta]) =>
            <article key={label}><small>{label}</small><p><strong>{value}</strong><span>{delta}</span></p></article>)}
        </div>
        <div className="network-board">
          <div className="network-growth">
            <b>Dataset growth</b>
            <svg viewBox="0 0 340 148" role="img" aria-label="Dataset growth from June to November">
              <line x1="18" y1="28" x2="322" y2="28"/><line x1="18" y1="68" x2="322" y2="68"/><line x1="18" y1="108" x2="322" y2="108"/>
              <path d={`${line} L318 128 L18 128 Z`} className="fill"/>
              <path d={line} className="stroke"/>
              {points.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5"/>)}
            </svg>
            <div className="axis"><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span></div>
          </div>
          <aside>
            <b>Recent contributions</b>
            <ul>
              <li><PersonStanding size={16} strokeWidth={1.75} aria-hidden="true"/><span>Movement check-in<small>2 min ago</small></span></li>
              <li><AudioLines size={16} strokeWidth={1.75} aria-hidden="true"/><span>Voice sample<small>14 min ago</small></span></li>
              <li><Wind size={16} strokeWidth={1.75} aria-hidden="true"/><span>Respiratory (FVC)<small>27 min ago</small></span></li>
            </ul>
          </aside>
        </div>
      </section>
    </section>
    <section className="network-flywheel" aria-label="How the dataset improves">
      <h2>A dataset that gets stronger over time.</h2>
      <ol>
        {steps.map(([Icon, title, copy], index) => <li key={title}>
          {index > 0 && <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true"/>}
          <span><Icon size={18} strokeWidth={1.75} aria-hidden="true"/></span>
          <div><b>{title}</b><small>{copy}</small></div>
        </li>)}
      </ol>
    </section>
  </main>;
}

function Feature({ eyebrow, title, copy, children, flip=false }: { eyebrow: string; title: string; copy: string; children: ReactNode; flip?: boolean }) {
  return <section className={flip ? 'feature flip' : 'feature'}>
    <div>
      <p className="kicker">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
    {children}
  </section>;
}

function DashboardLink({ label, onClick }: { label: string; onClick: () => void }) {
  return <p className="enter"><button onClick={onClick}>{label} <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true"/></button></p>;
}

function MacBook({ children, label }: { children: React.ReactNode; label: string }) {
  return <section className="mac-stage" aria-label={label}>
    <div className="mac">
      <div className="mac-lid">
        <span className="mac-camera" aria-hidden="true"/>
        <div className="mac-screen">{children}</div>
      </div>
      <div className="mac-base" aria-hidden="true"><div className="mac-hinge"/><div className="mac-deck"><span className="mac-trackpad"/></div></div>
    </div>
  </section>;
}

function CareScreen() {
  return <div className="device-screen">
    <aside>
      <img className="device-mark" src={mark} alt=""/>
      <span className="on"><Activity size={16} strokeWidth={1.5}/> Overview</span>
      <span><Video size={16} strokeWidth={1.5}/> Check-in</span>
      <span><HeartPulse size={16} strokeWidth={1.5}/> Progress</span>
      <span><FileText size={16} strokeWidth={1.5}/> Referral</span>
      <span><FlaskConical size={16} strokeWidth={1.5}/> Research</span>
      <span><Users size={16} strokeWidth={1.5}/> Care team</span>
      <span><MessageCircle size={16} strokeWidth={1.5}/> Assistant</span>
    </aside>
    <div className="device-main">
      <header>
        <h2>Overview</h2>
        <span className="search"><Search size={16} strokeWidth={1.5}/> Search</span>
        <i>JC</i>
      </header>
      <div className="device-patient">
        <b>AC</b>
        <span><strong>Alex Chen</strong><small>Patient · caregiver Jordan Chen</small></span>
        <span><small>Last check-in</small><strong>Nov 6 · 9:14 AM</strong></span>
        <span><small>Next appointment</small><strong>Nov 9, 10:30 AM</strong></span>
        <em>Ready</em>
      </div>
      <div className="device-metrics">
        <article><small>ALSFRS-R</small><strong>32 / 48</strong></article>
        <article><small>Sitting FVC</small><strong>76%</strong></article>
        <article><small>Speech clarity</small><strong>91%</strong></article>
        <article className="next">
          <small>Next in care</small>
          <span>Movement check-in<small>Today · 3 min</small></span>
          <span>Neurology review<small>Nov 9 · Virtual</small></span>
        </article>
      </div>
      <div className="device-chart">
        <div><small>Progress · ALSFRS-R</small><em>6 recorded visits</em></div>
        <svg viewBox="0 0 520 110" role="img" aria-label="ALSFRS-R across six visits">
          <line x1="16" y1="22" x2="500" y2="22"/><line x1="16" y1="52" x2="500" y2="52"/><line x1="16" y1="82" x2="500" y2="82"/>
          <path d="M28 24 C90 28 120 36 180 46 S280 62 340 72 S430 84 492 90" fill="none" stroke="#1d4ed8" strokeWidth="2"/>
          {[[28,24],[120,38],[210,54],[300,66],[390,80]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="#6b7487"/>)}
          <circle cx="492" cy="90" r="4" fill="#fff" stroke="#1d4ed8" strokeWidth="2"/>
        </svg>
        <div className="axis"><span>Jun ’24</span><span>Dec ’24</span><span>Jun ’25</span><span>Dec ’25</span><span>Sep ’26</span></div>
      </div>
    </div>
  </div>;
}

