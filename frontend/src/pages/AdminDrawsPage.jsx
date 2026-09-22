import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [mode, setMode] = useState('RANDOM');

  useEffect(() => {
    apiGet('/admin/draws').then((data) => setDraws(data.draws || [])).catch(() => setDraws([]));
  }, []);

  async function simulateDraw() {
    await apiPost('/admin/draws/simulate', { month, mode });
    const data = await apiGet('/admin/draws');
    setDraws(data.draws || []);
  }

  return (
    <div className="page-wrap">
      <h1>Draw management</h1>
      <div className="cta-row"><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /><select value={mode} onChange={(e) => setMode(e.target.value)}><option value="RANDOM">Random</option><option value="ALGORITHMIC">Algorithmic</option></select></div>
      <button className="button primary" onClick={simulateDraw}>Simulate draw</button>
      <div className="card-stack margins-top">
        {draws.map((draw) => (
          <div key={draw.id} className="summary-card">
            <span>{draw.month}</span>
            <strong>{draw.mode}</strong>
            <small>{draw.status}</small>
            {draw.status === 'simulated' && <button className="button secondary" onClick={async () => { await apiPost('/admin/draws/publish', { drawId: draw.id }); const data = await apiGet('/admin/draws'); setDraws(data.draws || []); }}>Publish</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
