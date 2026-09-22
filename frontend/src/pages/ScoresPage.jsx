import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';

export default function ScoresPage() {
  const [scores, setScores] = useState([]);
  const [form, setForm] = useState({ date: '', score: 25 });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadScores();
  }, []);

  async function loadScores() {
    const data = await apiGet('/scores');
    setScores(data.scores || []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await apiPost('/scores', form);
      setMessage('Score saved.');
      setForm({ date: '', score: 25 });
      await loadScores();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleUpdate(score) {
    try {
      await apiPut(`/scores/${score.date}`, { score: 35 });
      setMessage('Score updated.');
      await loadScores();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDelete(date) {
    await apiDelete(`/scores/${date}`);
    setMessage('Score removed.');
    await loadScores();
  }

  return (
    <div className="page-wrap">
      <h1>Scores</h1>
      {message && <div className="form-error">{message}</div>}
      <form className="auth-card" onSubmit={handleSubmit}>
        <label>
          Date
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        </label>
        <label>
          Score
          <input type="number" min="1" max="45" value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} required />
        </label>
        <button className="button primary full" type="submit">Add score</button>
      </form>
      <div className="card-stack margins-top">
        {scores.map((score) => (
          <div key={`${score.date}-${score.score}`} className="summary-card">
            <span>{score.date}</span>
            <strong>{score.score}</strong>
            <div className="inline-actions">
              <button className="button secondary" onClick={() => handleUpdate(score)}>Edit</button>
              <button className="button secondary" onClick={() => handleDelete(score.date)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
