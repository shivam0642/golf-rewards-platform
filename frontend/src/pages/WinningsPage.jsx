import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../services/api';

export default function WinningsPage() {
  const [winners, setWinners] = useState([]);
  const [proof, setProof] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiGet('/winners')
      .then((data) => setWinners(data.winners || []))
      .catch(() => setWinners([]));
  }, []);

  async function submitProof(id) {
    try {
      await apiPost(`/winners/${id}/proof`, { proofUrl: proof[id] });
      setMessage('Proof submitted for review.');
      const data = await apiGet('/winners');
      setWinners(data.winners || []);
    } catch (error) { setMessage(error.message); }
  }

  return (
    <div className="page-wrap">
      <h1>Winnings</h1>
      {message && <div className="form-error">{message}</div>}
      <div className="card-stack">
        {winners.length ? winners.map((winner) => (
          <div key={winner.id} className="summary-card">
            <span>Match {winner.matchedNumbers || 'n/a'}</span>
            <strong>£{winner.prizeAmount || 0}</strong>
            <small>{winner.verificationStatus || 'pending'}</small>
            {winner.verificationStatus !== 'approved' && winner.payoutStatus !== 'paid' && <>
              <input aria-label="Proof URL" placeholder="Screenshot URL" value={proof[winner.id] || ''} onChange={(e) => setProof({ ...proof, [winner.id]: e.target.value })} />
              <button className="button secondary" onClick={() => submitProof(winner.id)}>Submit proof</button>
            </>}
          </div>
        )) : <div className="summary-card"><span>No wins yet.</span><strong>Keep playing</strong></div>}
      </div>
    </div>
  );
}
