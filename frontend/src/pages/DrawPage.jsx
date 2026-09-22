import { useEffect, useState } from 'react';
import { apiGet } from '../services/api';

export default function DrawPage() {
  const [draws, setDraws] = useState([]);

  useEffect(() => {
    apiGet('/draws')
      .then((data) => setDraws(data.draws || []))
      .catch(() => setDraws([]));
  }, []);

  return (
    <div className="page-wrap">
      <div className="section-heading">
        <span className="eyebrow accent">Monthly draw</span>
        <h2>Match the right numbers. Win the right prize.</h2>
      </div>
      <div className="draw-rules">
        <div className="rule-box"><span>5-number match</span><strong>40% of pool</strong></div>
        <div className="rule-box"><span>4-number match</span><strong>35% of pool</strong></div>
        <div className="rule-box"><span>3-number match</span><strong>25% of pool</strong></div>
      </div>
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
