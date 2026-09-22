import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../services/api';

export default function CharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const query = new URLSearchParams({ ...(search && { search }), ...(category && { category }) });
    apiGet(`/charities?${query}`)
      .then((data) => setCharities(data.charities || []))
      .catch(() => setCharities([]));
  }, [search, category]);

  return (
    <div className="page-wrap">
      <div className="section-heading">
        <span className="eyebrow accent">Charities</span>
        <h2>Support the causes that matter most.</h2>
      </div>
      <div className="cta-row">
        <input aria-label="Search charities" placeholder="Search charities" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="Youth">Youth</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Environment">Environment</option>
        </select>
      </div>
      <div className="charity-grid">
        {charities.map((charity) => (
          <Link key={charity.id} to={`/charities/${charity.id}`} className="charity-card">
            <div className="charity-image" style={{ backgroundImage: `url(${charity.image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80'})` }} />
            <div className="charity-body">
              <span>{charity.category || 'Community'}</span>
              <h3>{charity.name}</h3>
              <p>{charity.description || 'Impact-driven community support.'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
