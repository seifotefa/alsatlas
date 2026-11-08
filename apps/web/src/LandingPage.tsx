import type { ReactNode } from 'react';
import Activity from 'lucide-react/dist/esm/icons/activity';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import FlaskConical from 'lucide-react/dist/esm/icons/flask-conical';
import HeartPulse from 'lucide-react/dist/esm/icons/heart-pulse';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Search from 'lucide-react/dist/esm/icons/search';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Users from 'lucide-react/dist/esm/icons/users';
import Video from 'lucide-react/dist/esm/icons/video';
import mark from './assets/mark.png';
import './landing.css';

export type Page = 'home' | 'product' | 'diagnosis' | 'research';
type Go = (view: 'home' | 'product' | 'diagnosis' | 'network' | 'survey' | 'dashboard' | 'research' | 'researcher', tab?: 'overview' | 'checkin' | 'progress' | 'referral' | 'research' | 'care' | 'assistant') => void;

export function LandingPage({ page, go }: { page: Page; go: Go }) {
  return <div className="marketing">
    <SiteNav page={page} go={go}/>
    {page === 'home' && <Home go={go}/>}
    {page === 'product' && <Product go={go}/>}
    {page === 'diagnosis' && <Diagnosis go={go}/>}
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

function Diagnosis({ go }: { go: Go }) {
  return <main className="subpage">
    <header className="page-lead">
      <p className="kicker">Diagnosis</p>
      <h1>A clearer first conversation</h1>
      <p>The intake organizes what someone has noticed. It does not diagnose ALS. A clinician still decides what the summary means.</p>
    </header>
    <ol className="intake">
      <li>
        <span>01</span>
        <div>
          <h2>When and where it started</h2>
          <p>Onset, body region, and laterality. The same opening a referral conversation usually needs.</p>
        </div>
        <div className="slice form">
          <label>Approximate onset<b>March 2025</b></label>
          <label>Body region<b>Upper body</b></label>
          <label>Laterality<b>Right</b></label>
        </div>
      </li>
      <li>
        <span>02</span>
        <div>
          <h2>Which changes are present</h2>
          <p>Weakness, walking, speech, and swallowing stay labeled as patient-reported until a clinician confirms them.</p>
        </div>
        <div className="slice choices">
          <div className="picked">Progressive muscle weakness</div>
          <div className="picked">Walking, stairs, or falls</div>
          <div>Speech changes</div>
          <div>Swallowing changes</div>
        </div>
      </li>
      <li>
        <span>03</span>
        <div>
          <h2>A summary you can hand over</h2>
          <p>The result is a conversation starter and a PDF. Nothing in it is a probability, a rule-out, or a diagnosis.</p>
        </div>
        <div className="slice report">
          <FileText size={16} strokeWidth={1.5}/>
          <div><b>Clinician summary</b><small>Upper body · right side · progressing</small></div>
          <em>PDF</em>
        </div>
      </li>
    </ol>
    <DashboardLink label="Open diagnosis intake" onClick={() => go('survey')}/>
  </main>;
}

function ResearchLanding({ go }: { go: Go }) {
  const steps = ['Patient consent', 'Time-stamped observations', 'De-identification and governance', 'Approved research access'];
  return <main className="research-page">
    <header className="research-top">
      <div>
        <h1>Research network</h1>
        <p>A consent-based longitudinal dataset for ALS research.</p>
      </div>
      <button className="research-open" onClick={() => go('researcher')}>Open research dashboard</button>
    </header>
    <section className="research-metrics" aria-label="Research model">
      <article><small>Data categories</small><strong>Function, movement, speech, breathing</strong></article>
      <article><small>Participation</small><strong>Voluntary and separate from care</strong></article>
      <article><small>Reward model</small><strong>$1 per accepted point</strong></article>
    </section>
    <section className="research-pipeline">
      <h2>Longitudinal data model</h2>
      <ol>
        {steps.map((step, index) => <li key={step}><span>{index + 1}</span><b>{step}</b></li>)}
      </ol>
    </section>
    <section className="research-table">
      <h2>Research access models</h2>
      <table>
        <thead><tr><th>Who</th><th>How access is earned</th></tr></thead>
        <tbody>
          <tr><td>Institution</td><td>Pays for the current consented dataset</td></tr>
          <tr><td>Researcher</td><td>Contributes findings that improve the set</td></tr>
          <tr><td>Physician</td><td>Offers consultations or volunteer time</td></tr>
        </tbody>
      </table>
    </section>
    <p className="research-note">Participation is voluntary, and research access is governed. A Solana reward follows review. It is not payment for medical data.</p>
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

