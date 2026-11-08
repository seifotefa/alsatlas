import { useMemo, useState } from 'react';
import mark from './assets/mark.png';
import './researcher-desk.css';

const institutions: [string, string, number][] = [
  ['Sunnybrook Health Sciences', 'Toronto', 6420],
  ['Montreal Neurological Institute', 'Montreal', 4180],
  ['Massachusetts General Hospital', 'Boston', 3910],
  ['Johns Hopkins', 'Baltimore', 3520],
  ['UCSF', 'San Francisco', 3180],
  ['Mayo Clinic', 'Rochester', 2940],
  ['King’s College London', 'London', 2710],
  ['University of Oxford', 'Oxford', 2480],
  ['Charité', 'Berlin', 2260],
  ['University of Tokyo', 'Tokyo', 2100],
  ['Seoul National University', 'Seoul', 1980],
  ['University of Sydney', 'Sydney', 1860],
  ['Karolinska Institutet', 'Stockholm', 1740],
  ['University of Pennsylvania', 'Philadelphia', 1620],
  ['Cleveland Clinic', 'Cleveland', 1510],
  ['Stanford', 'Palo Alto', 1400],
  ['Northwestern', 'Chicago', 1280],
  ['University of British Columbia', 'Vancouver', 1180],
];

const catalogues: [string, string, number][] = [
  ['Longitudinal function', 'ALSFRS-R across clinic visits', 18420],
  ['Daily check-ins', 'Energy and what changed between visits', 11540],
  ['Movement observations', 'Walking, stairs, and hand use', 9110],
  ['Speech summaries', 'Clarity and timing from consented samples', 6240],
  ['Respiratory function', 'Sitting and supine FVC', 4860],
  ['Bulbar features', 'Speech, swallowing, and saliva', 3120],
  ['Referral timelines', 'From first concern to a specialty visit', 2040],
];

const ages = ['All ages', '18–39', '40–59', '60–74', '75+'];
const sexes = ['All', 'Female', 'Male'];
const onsets = ['Any onset', 'Limb', 'Bulbar', 'Respiratory'];
const regions = ['All regions', 'North America', 'Europe', 'Asia-Pacific'];

const consultations = [
  ['Mon 9 Nov', '2:00 PM', 'Virtual follow-up', 'Booked'],
  ['Thu 12 Nov', '11:00 AM', 'Speech and swallowing review', 'Booked'],
  ['Tue 17 Nov', '4:30 PM', 'Caregiver consultation', 'Booked'],
];

const studies = [
  ['Afternoon energy and ALSFRS-R', 'Contributed 2025'],
  ['Speech clarity across 18 months', 'Contributed 2026'],
  ['Sitting FVC between clinic visits', 'Contributed 2026'],
];

type Section = 'network' | 'institutions' | 'datasets' | 'desk';

function sliceCount(base: number, age: string, sex: string, onset: string, region: string) {
  let count = base;
  if (age !== 'All ages') count *= 0.31;
  if (sex !== 'All') count *= 0.52;
  if (onset !== 'Any onset') count *= 0.38;
  if (region !== 'All regions') count *= 0.44;
  return Math.max(40, Math.round(count));
}

export function ResearcherDesk() {
  const [section, setSection] = useState<Section>('network');
  const [age, setAge] = useState(ages[0]);
  const [sex, setSex] = useState(sexes[0]);
  const [onset, setOnset] = useState(onsets[0]);
  const [region, setRegion] = useState(regions[0]);
  const [notice, setNotice] = useState('');
  const [rewarding, setRewarding] = useState(false);
  const peak = institutions[0][2];
  const slice = useMemo(() => [age, sex, onset, region].filter(item => !item.startsWith('All') && item !== 'Any onset'), [age, sex, onset, region]);

  const filters = (
    <div className="net-filters" aria-label="Dataset slice">
      <Filter label="Age" value={age} options={ages} onChange={setAge}/>
      <Filter label="Sex" value={sex} options={sexes} onChange={setSex}/>
      <Filter label="Onset" value={onset} options={onsets} onChange={setOnset}/>
      <Filter label="Region" value={region} options={regions} onChange={setRegion}/>
    </div>
  );

  const catalogue = (
    <div className="net-catalogue">
      {catalogues.map(([name, detail, base]) => {
        const count = sliceCount(base, age, sex, onset, region);
        return <article key={name}>
          <div><b>{name}</b><small>{detail}</small></div>
          <strong>{count.toLocaleString()}</strong>
          <span>records in this slice</span>
          <button type="button" onClick={() => setNotice(`${name} request recorded${slice.length ? ` for ${slice.join(', ')}` : ''}.`)}>Request access</button>
        </article>;
      })}
    </div>
  );

  return <div className="desk">
    <aside>
      <a href="/" aria-label="ALS Atlas home"><img src={mark} alt=""/></a>
      <div className="who">
        <b>Dr. Priya Shah</b>
        <span>Faculty neurologist</span>
      </div>
      <nav aria-label="Research desk">
        {([['network', 'Network'], ['institutions', 'Institutions'], ['datasets', 'Datasets'], ['desk', 'Your desk']] as [Section, string][]).map(([id, label]) =>
          <button key={id} className={section === id ? 'on' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}>{label}</button>)}
      </nav>
      <a className="exit" href="/">Back to site</a>
    </aside>
    <main>
      {section === 'network' && <>
        <header className="net-lead">
          <div>
            <p>Research network</p>
            <h1>Eighteen centers, one governed dataset</h1>
            <span>Patients, clinics, and investigators add to the same longitudinal record. You request the slice your study needs.</span>
          </div>
          <em><i/>Actively growing</em>
        </header>
        <section className="net-stats" aria-label="Network scale">
          {[['Institutions', '18'], ['Contributors', '1,284'], ['Observations', '48,392'], ['Research projects', '14']].map(([label, value]) =>
            <article key={label}><small>{label}</small><strong>{value}</strong></article>)}
        </section>
        <section className="net-panel">
          <div className="net-panel-head"><h2>Contributing institutions</h2><button type="button" onClick={() => setSection('institutions')}>All 18</button></div>
          <ol className="net-bars">
            {institutions.slice(0, 8).map(([name, city, count], index) => <li key={name} className={index === 0 ? 'lead' : ''}>
              <b>{name}</b><small>{city}</small>
              <i style={{ width: `${Math.max(8, (count / peak) * 100)}%` }}/>
              <span>{count.toLocaleString()}</span>
            </li>)}
          </ol>
        </section>
        <section className="net-panel">
          <div className="net-panel-head"><h2>Request a dataset</h2><button type="button" onClick={() => setSection('datasets')}>Full catalogue</button></div>
          <p className="net-note">Choose who the records describe. The count is that slice, not the whole network.</p>
          {filters}
          {catalogue}
          {notice && <p className="net-notice" role="status">{notice}</p>}
        </section>
      </>}
      {section === 'institutions' && <>
        <header className="net-lead"><div><p>Institutions</p><h1>Where the records come from</h1></div></header>
        <ol className="net-bars net-bars-all">
          {institutions.map(([name, city, count], index) => <li key={name} className={index === 0 ? 'lead' : ''}>
            <b>{name}</b><small>{city}</small>
            <i style={{ width: `${Math.max(8, (count / peak) * 100)}%` }}/>
            <span>{count.toLocaleString()}</span>
          </li>)}
        </ol>
      </>}
      {section === 'datasets' && <>
        <header className="net-lead"><div><p>Datasets</p><h1>Ask for the people your study is about</h1><span>Age, sex, onset, and region narrow the governed aggregate. A clinician still decides what a record means.</span></div></header>
        {filters}
        {catalogue}
        {notice && <p className="net-notice" role="status">{notice}</p>}
      </>}
      {section === 'desk' && <>
        <header className="net-lead"><div><p>Your desk</p><h1>Dr. Priya Shah</h1><span>Consultations you are giving, and studies you have already put into the network.</span></div></header>
        <div className="net-own">
          <section>
            <h2>Consultations</h2>
            <table>
              <thead><tr><th>Date</th><th>Time</th><th>Visit</th><th>Status</th></tr></thead>
              <tbody>{consultations.map(row => <tr key={row[2]}>{row.map(cell => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </section>
          <section>
            <h2>Studies contributed</h2>
            <ul>{studies.map(([title, when]) => <li key={title}><b>{title}</b><span>{when}</span></li>)}</ul>
          </section>
        </div>
      </>}
      <section className="net-reward" aria-labelledby="solana-reward">
        <h2 id="solana-reward">Solana reward</h2>
        <p>Accept a simulated dataset batch and credit each participant $5 worth of SOL.</p>
        <button type="button" disabled={rewarding} onClick={async () => { setRewarding(true); try { const response = await fetch('/api/research/demo/accept-dataset', { method: 'POST' }); const data = await response.json(); setNotice(response.ok ? `Dataset accepted. Alex credited $${data.participantCredited} in SOL.` : data.error || 'Dataset payout could not be completed.'); } catch { setNotice('Dataset payout could not be completed.'); } finally { setRewarding(false); } }}>{rewarding ? 'Processing dataset…' : 'Accept dataset & pay participants'}</button>
        {notice && <p className="net-notice" role="status">{notice}</p>}
      </section>
    </main>
  </div>;
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select></label>;
}
