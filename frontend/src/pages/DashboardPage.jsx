import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState({ participation: { drawsEntered: 0, upcomingDraws: [] }, winnings: { totalWon: 0, currentPaymentStatus: 'none' } });

  useEffect(() => {
    apiGet('/scores')
      .then((data) => setScores(data.scores || []))
      .catch(() => setScores([]));

    apiGet('/subscriptions')
      .then((data) => setSubscriptions(data.subscriptions || []))
      .catch(() => setSubscriptions([]));

    apiGet('/dashboard')
      .then(setSummary)
      .catch(() => setSummary({ participation: { drawsEntered: 0, upcomingDraws: [] }, winnings: { totalWon: 0, currentPaymentStatus: 'none' } }));
  }, []);

  return (
    <div className="page-wrap">
      <h1>Dashboard</h1>
      <div className="summary-grid">
        <div className="summary-card"><span>Subscription</span><strong>{user?.subscriptionStatus || 'inactive'}</strong></div>
        <div className="summary-card"><span>Plan</span><strong>{user?.plan || 'monthly'}</strong></div>
        <div className="summary-card"><span>Contribution</span><strong>{user?.contributionPercent || 10}%</strong></div>
        <div className="summary-card"><span>Draws entered</span><strong>{summary.participation.drawsEntered}</strong></div>
        <div className="summary-card"><span>Total won</span><strong>£{summary.winnings.totalWon}</strong></div>
        <div className="summary-card"><span>Payment status</span><strong>{summary.winnings.currentPaymentStatus}</strong></div>
      </div>
      <div className="dashboard-links">
        <Link className="button secondary" to="/scores">Scores</Link>
        <Link className="button secondary" to="/subscription">Subscription</Link>
        <Link className="button secondary" to="/charity">Charity</Link>
        <Link className="button secondary" to="/draws">Draws</Link>
        <Link className="button secondary" to="/winnings">Winnings</Link>
        <Link className="button secondary" to="/profile">Profile</Link>
      </div>
      <div className="two-column-grid">
        <div className="summary-card">
          <h3>Latest scores</h3>
          {scores.length ? scores.slice(0, 5).map((score) => (
            <div key={`${score.date}-${score.score}`} className="mini-row"><span>{score.date}</span><strong>{score.score}</strong></div>
          )) : <p>No scores entered yet.</p>}
        </div>
        <div className="summary-card">
          <h3>Participation</h3>
          <p>{summary.participation.upcomingDraws.length} upcoming draw(s)</p>
          {summary.participation.upcomingDraws.slice(0, 3).map((draw) => <div key={draw.id} className="mini-row"><span>{draw.month}</span><strong>{draw.status}</strong></div>)}
        </div>
        <div className="summary-card">
          <h3>Subscription</h3>
          {subscriptions.length ? subscriptions.map((sub) => (
            <div key={sub.id} className="mini-row"><span>{sub.plan}</span><strong>{sub.status}</strong></div>
          )) : <p>No active subscription yet.</p>}
        </div>
      </div>
    </div>
  );
}
