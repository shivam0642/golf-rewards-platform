const request = require('supertest');
const app = require('../../server');
const { isSupabaseConfigured } = require('../config/supabase');

describe('authentication API', () => {
  const integration = isSupabaseConfigured() ? test : test.skip;

  integration('rejects unauthenticated subscriber requests', async () => {
    const response = await request(app).get('/api/scores');
    expect(response.status).toBe(401);
  });

  integration('logs in the seeded demo subscriber', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: process.env.DEMO_EMAIL || 'demo@digitalheroes.com', password: process.env.DEMO_PASSWORD || 'Demo123!' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  integration('keeps admin routes protected from subscribers', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: process.env.DEMO_EMAIL || 'demo@digitalheroes.com', password: process.env.DEMO_PASSWORD || 'Demo123!' });
    const response = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${login.body.token}`);
    expect(response.status).toBe(403);
  });

  test('reports missing database configuration instead of using local storage', async () => {
    if (isSupabaseConfigured()) return;
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(503);
    expect(response.body.database).toBe('not_configured');
  });
});
