import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'General', description: '', location: 'United Kingdom' });

  useEffect(() => {
    apiGet('/admin/charities')
      .then((data) => setCharities(data.charities || []))
      .catch(() => setCharities([]));
  }, []);

  async function reload() { const data = await apiGet('/admin/charities'); setCharities(data.charities || []); }
  async function save(event) { event.preventDefault(); await apiPost('/charities', form); setForm({ name: '', category: 'General', description: '', location: 'United Kingdom' }); await reload(); }

  return (
    <div className="page-wrap">
      <h1>Charities</h1>
      <form className="auth-card" onSubmit={save}><input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /><input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required /><textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><button className="button primary" type="submit">Add charity</button></form>
      <div className="card-stack">
        {charities.map((charity) => (
          <div key={charity.id} className="summary-card">
            <span>{charity.category}</span>
            <strong>{charity.name}</strong>
            <small>{charity.location}</small>
            <div className="inline-actions"><button className="button secondary" onClick={async () => { await apiPut(`/charities/${charity.id}`, { featured: !charity.featured }); await reload(); }}>{charity.featured ? 'Unfeature' : 'Feature'}</button>{charity.active ? <button className="button secondary" onClick={async () => { await apiDelete(`/charities/${charity.id}`); await reload(); }}>Archive</button> : <button className="button secondary" onClick={async () => { await apiPut(`/charities/${charity.id}`, { active: true }); await reload(); }}>Restore</button>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
