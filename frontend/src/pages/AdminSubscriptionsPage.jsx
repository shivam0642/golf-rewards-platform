import { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../services/api';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  useEffect(() => {
    apiGet('/admin/subscriptions').then((data) => setSubscriptions(data.subscriptions || [])).catch(() => setSubscriptions([]));
  }, []);

  async function setStatus(subscription, status) {
    await apiPatch(`/admin/subscriptions/${subscription.id}`, { status });
    const data = await apiGet('/admin/subscriptions');
    setSubscriptions(data.subscriptions || []);
  }

  return (
    <div className="page-wrap">
      <h1>Subscriptions</h1>
      <div className="card-stack">
        {subscriptions.map((subscription) => (
          <div key={subscription.id} className="summary-card">
            <span>{subscription.plan}</span>
            <strong>{subscription.status}</strong>
            <small>£{subscription.amount}</small>
            <select value={subscription.status} onChange={(e) => setStatus(subscription, e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="past_due">Past due</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option></select>
          </div>
        ))}
      </div>
    </div>
  );
}
