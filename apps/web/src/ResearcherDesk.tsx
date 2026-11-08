import { useState } from 'react';
import mark from './assets/mark.png';
import { ResearchPage } from './ResearchPage';
import './researcher-desk.css';

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

const datasets = [
  ['Longitudinal function', 'De-identified aggregate', 'Open'],
  ['Speech sample summaries', 'De-identified aggregate', 'Open'],
  ['Movement observations', 'De-identified aggregate', 'Not open'],
];

type Section = 'overview' | 'consultations' | 'studies' | 'datasets';

export function ResearcherDesk() {
  const [section, setSection] = useState<Section>('overview');
  return <div className="desk">
    <aside>
      <a href="/" aria-label="ALS Atlas home"><img src={mark} alt=""/></a>
      <div className="who">
        <b>Dr. Priya Shah</b>
        <span>Faculty neurologist</span>
      </div>
      <nav aria-label="Research desk">
        {(['overview', 'consultations', 'studies', 'datasets'] as Section[]).map(id =>
          <button key={id} className={section === id ? 'on' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}>{id === 'overview' ? 'Overview' : id[0].toUpperCase() + id.slice(1)}</button>)}
      </nav>
      <a className="exit" href="/">Back to site</a>
    </aside>
    <main>
      <header>
        <div>
          <h1>{section === 'overview' ? 'University desk' : section[0].toUpperCase() + section.slice(1)}</h1>
          <p>Consultations, studies, and dataset access.</p>
        </div>
        <span>Nov 2026</span>
      </header>
      {(section === 'overview') && <section className="stats" aria-label="Access summary">
        <article><span>Consultations booked</span><strong>3</strong></article>
        <article><span>Studies contributed</span><strong>3</strong></article>
        <article><span>Datasets open</span><strong>2</strong></article>
      </section>}
      <div className={section === 'overview' ? 'split' : 'single'}>
        {(section === 'overview' || section === 'consultations') && <section className="panel">
          <h2>Consultations</h2>
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Visit</th><th>Status</th></tr></thead>
            <tbody>{consultations.map(row => <tr key={row[2]}>{row.map(cell => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </section>}
        {(section === 'overview' || section === 'studies') && <section className="panel">
          <h2>Studies contributed</h2>
          <ul>{studies.map(([title, when]) => <li key={title}><b>{title}</b><span>{when}</span></li>)}</ul>
        </section>}
      </div>
      {(section === 'overview' || section === 'datasets') && <section className="panel datasets">
        <h2>Dataset access</h2>
        <table>
          <thead><tr><th>Dataset</th><th>Form</th><th>Access</th></tr></thead>
          <tbody>{datasets.map(row => <tr key={row[0]}>{row.map(cell => <td key={cell} className={cell === 'Open' ? 'open' : ''}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </section>}
      <ResearchPage detailsOnly/>
    </main>
  </div>;
}
