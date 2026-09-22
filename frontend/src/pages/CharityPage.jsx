import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CharityPage() {
  const [charities, setCharities] = useState([]);
  const [selectedId, setSelectedId] = useState('charity-1');
  const [percent, setPercent] = useState(10);
  const [donationAmount, setDonationAmount] = useState(10);
  const [message, setMessage] = useState('');
  const { user, setUser } = useAuth();

  useEffect(() => {
    apiGet('/charities')
      .then((data) => {
        setCharities(data.charities || []);
        if (user?.charityId) setSelectedId(user.charityId);
        else if (data.charities?.[0]) setSelectedId(data.charities[0].id);
        if (user?.contributionPercent) setPercent(user.contributionPercent);
      })
      .catch(() => setCharities([]));
  }, [user?.charityId, user?.contributionPercent]);

  async function handleSave(event) {
    event.preventDefault();
    try {
      const response = await apiPatch('/users/me/preferences', { charityId: selectedId, contributionPercent: percent });
      setUser(response.user);
      setMessage('Charity preference saved.');
    } catch (error) { setMessage(error.message); }
  }

  async function handleDonation(event) {
    event.preventDefault();
    try {
      await apiPost('/donations', { charityId: selectedId, amount: donationAmount });
      setMessage('Independent donation recorded for processing.');
    } catch (error) { setMessage(error.message); }
  }

  return (
    <div className="page-wrap">
      <h1>Charity</h1>
      {message && <div className="form-error">{message}</div>}
      <form className="auth-card" onSubmit={handleSave}>
        <label>
          Charity
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {charities.map((charity) => (
              <option key={charity.id} value={charity.id}>{charity.name}</option>
            ))}
          </select>
        </label>
        <label>
          Contribution percentage
          <input type="number" min="10" value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
        </label>
        <button className="button primary full" type="submit">Save selection</button>
      </form>
      <form className="auth-card margins-top" onSubmit={handleDonation}>
        <h2>Independent donation</h2>
        <p className="muted-copy">Give directly to your selected cause without changing your subscription.</p>
        <label>
          Amount (£)
          <input type="number" min="1" step="0.01" value={donationAmount} onChange={(e) => setDonationAmount(Number(e.target.value))} required />
        </label>
        <button className="button secondary full" type="submit">Record donation</button>
      </form>
    </div>
  );
}
