import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="page-wrap">
      <h1>Profile</h1>
      <div className="summary-card">
        <span>Name</span>
        <strong>{user?.name || 'Digital Hero'}</strong>
        <small>{user?.email || 'no-email'}</small>
      </div>
    </div>
  );
}
