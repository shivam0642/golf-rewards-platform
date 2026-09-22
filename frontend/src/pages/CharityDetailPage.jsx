import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet } from '../services/api';

export default function CharityDetailPage() {
  const { id } = useParams();
  const [charity, setCharity] = useState(null);

  useEffect(() => {
    apiGet(`/charities/${id}`)
      .then((data) => setCharity(data.charity))
      .catch(() => setCharity(null));
  }, [id]);

  if (!charity) return <div className="page-wrap">Loading charity...</div>;

  return (
    <div className="page-wrap">
      <div className="detail-card">
        <div className="detail-image" style={{ backgroundImage: `url(${charity.image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80'})` }} />
        <div className="detail-copy">
          <span className="eyebrow accent">{charity.category || 'Community'}</span>
          <h1>{charity.name}</h1>
          <p>{charity.description}</p>
          <ul className="detail-list">
            <li>Location: {charity.location || 'United Kingdom'}</li>
            <li>Featured: {charity.featured ? 'Yes' : 'No'}</li>
          </ul>
          <h3>Upcoming events</h3>
          {charity.upcomingEvents?.length ? <ul className="detail-list">{charity.upcomingEvents.map((event) => <li key={event}>{event}</li>)}</ul> : <p>No upcoming events listed.</p>}
        </div>
      </div>
    </div>
  );
}
