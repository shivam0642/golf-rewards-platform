import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost, setAuthToken } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const response = await apiPost('/auth/login', form);
      setAuthToken(response.token);
      setUser(response.user);
      console.log('LOGIN USER:', response.user);
      console.log('LOGIN ROLE:', response.user.role);
      navigate(response.user.role === 'ADMINISTRATOR' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p>Sign in to manage your scores, charity, and monthly draw entry.</p>
        {error && <div className="form-error">{error}</div>}
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        <button type="submit" className="button primary full">Login</button>
        <p className="switch-copy">Need an account? <Link to="/signup">Create one</Link></p>
      </form>
    </div>
  );
}
