import { Link } from 'react-router-dom';

export default function AdminPage() {
  return (
    <div className="page-wrap">
      <h1>Admin dashboard</h1>
      <div className="summary-grid">
        <div className="summary-card"><span>Users</span><strong><Link to="/admin/users">Manage</Link></strong></div>
        <div className="summary-card"><span>Subscriptions</span><strong><Link to="/admin/subscriptions">Review</Link></strong></div>
        <div className="summary-card"><span>Draws</span><strong><Link to="/admin/draws">Run</Link></strong></div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><span>Charities</span><strong><Link to="/admin/charities">Maintain</Link></strong></div>
        <div className="summary-card"><span>Winners</span><strong><Link to="/admin/winners">Verify</Link></strong></div>
        <div className="summary-card"><span>Reports</span><strong><Link to="/admin/reports">View</Link></strong></div>
      </div>
    </div>
  );
}
