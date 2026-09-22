import { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../services/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    apiGet('/admin/users').then((data) => setUsers(data.users || [])).catch(() => setUsers([]));
  }, []);

  async function setStatus(user, status) {
    await apiPatch(`/admin/users/${user.id}`, { subscriptionStatus: status });
    const data = await apiGet('/admin/users');
    setUsers(data.users || []);
  }

  return (
    <div className="page-wrap">
      <h1>Users</h1>
      <div className="card-stack">
        {users.map((user) => (
          <div key={user.id} className="summary-card">
            <span>{user.role}</span>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
            <select value={user.subscriptionStatus || 'inactive'} onChange={(e) => setStatus(user, e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="past_due">Past due</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option></select>
          </div>
        ))}
      </div>
    </div>
  );
}
