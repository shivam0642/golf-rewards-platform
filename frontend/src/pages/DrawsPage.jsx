import { useEffect, useState } from 'react';
import { apiGet } from '../services/api';

export default function DrawsPage() {
  const [draws, setDraws] = useState([]);

  useEffect(() => {
    apiGet('/draws')
      .then((data) => setDraws(data.draws || []))
      .catch(() => setDraws([]));
  }, []);

  return (
    <div className="page-wrap">
      <h1>Draw participation</h1>
      <div className="card-stack">
        {draws.map((draw) => (
          <div key={draw.id} className="summary-card">
            <span>{draw.month}</span>
            <strong>{draw.mode}</strong>
            <small>{draw.status}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
