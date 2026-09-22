import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState('monthly');
  const { setUser } = useAuth();

  useEffect(() => {
    apiGet('/subscriptions')
      .then((data) => {
        if (data.subscriptions?.[0]) {
          setSubscription(data.subscriptions[0]);
          setPlan(data.subscriptions[0].plan || 'monthly');
        }
      })
      .catch(() => setSubscription(null));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const response = await apiPost('/subscriptions', { plan });
    setSubscription(response.subscription);
    if (response.user) setUser(response.user);
  }

  async function cancelSubscription() {
    if (!subscription) return;
    const response = await apiPatch(`/subscriptions/${subscription.id}`, { status: 'cancelled' });
    setSubscription(response.subscription);
    if (response.user) setUser(response.user);
  }

  return (
    <div className="page-wrap">
      <h1>Subscription</h1>
      <form className="auth-card" onSubmit={handleSubmit}>
        <label>
          Plan
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
        <button className="button primary full" type="submit">Save plan</button>
        {subscription?.status === 'active' && <button className="button secondary full" type="button" onClick={cancelSubscription}>Cancel subscription</button>}
      </form>
      {subscription && (
        <div className="summary-card"><span>Status</span><strong>{subscription.status}</strong><small>{subscription.plan} • £{subscription.amount}</small></div>
      )}
    </div>
  );
}
