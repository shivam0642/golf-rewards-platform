import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost, setAuthToken } from '../services/api';
import { useAuth } from '../context/AuthContext';

const defaultForm = {
  name: '',
  email: '',
  password: '',
  charityId: 'charity-1',
  contributionPercent: 10,
};

export default function SignupPage() {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const response = await apiPost('/auth/signup', form);
      setAuthToken(response.token);
      setUser(response.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <p>Join Digital Heroes and start playing for impact.</p>
        {error && <div className="form-error">{error}</div>}
        <label>
          Name
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        <label>
          Contribution %
          <input type="number" min="10" value={form.contributionPercent} onChange={(e) => setForm({ ...form, contributionPercent: Number(e.target.value) })} required />
        </label>
        <button type="submit" className="button primary full">Join now</button>
        <p className="switch-copy">Already a member? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
