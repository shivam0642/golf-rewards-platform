import { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../services/api';

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    apiGet('/winners').then((data) => setWinners(data.winners || [])).catch(() => setWinners([]));
  }, []);

  async function loadWinners() {
    apiGet('/winners').then((data) => setWinners(data.winners || [])).catch(() => setWinners([]));
  }

  async function updateWinner(id, action) {
    await apiPatch(`/winners/${id}/${action}`, {});
    await loadWinners();
  }

  return (
    <div className="page-wrap">
      <h1>Winners</h1>
      <div className="card-stack">
        {winners.map((winner) => (
          <div key={winner.id} className="summary-card">
            <span>{winner.payoutStatus}</span>
            <strong>{winner.userId}</strong>
            <small>Prize: £{winner.prizeAmount || 0}</small>
            <div className="cta-row">
              {winner.verificationStatus === 'pending' && <>
                <button className="button secondary" onClick={() => updateWinner(winner.id, 'approve')}>Approve</button>
                <button className="button secondary" onClick={() => updateWinner(winner.id, 'reject')}>Reject</button>
              </>}
              {winner.verificationStatus === 'approved' && winner.payoutStatus === 'pending' && <button className="button primary" onClick={() => updateWinner(winner.id, 'pay')}>Mark paid</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
