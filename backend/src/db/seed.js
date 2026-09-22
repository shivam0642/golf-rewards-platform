const bcrypt = require('bcryptjs');
const { getSupabase } = require('../config/supabase');

const charities = [
  {
    name: 'Youth Sports Foundation', category: 'Youth',
    description: 'Supports youth sport access and community coaching in underserved neighborhoods.',
    location: 'United Kingdom', image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
    featured: true, active: true, upcoming_events: ['Community fund match - 12 Oct', 'Skills clinic - 28 Oct'],
  },
  {
    name: 'Local Care Network', category: 'Healthcare',
    description: 'Delivers preventive care, support services, and wellbeing programmes for local families.',
    location: 'Ireland', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    featured: true, active: true, upcoming_events: ['Wellbeing drive - 02 Oct', 'Volunteer support day - 16 Oct'],
  },
  {
    name: 'Ocean Recovery Trust', category: 'Environment',
    description: 'Funds coastal restoration and marine conservation projects that protect biodiversity.',
    location: 'Scotland', image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80',
    featured: false, active: true, upcoming_events: ['Beach clean team day - 05 Oct'],
  },
];

async function upsertByEmail(supabase, user) {
  const passwordHash = await bcrypt.hash(user.password, 10);
  const { data, error } = await supabase.from('users').upsert({
    email: user.email.toLowerCase(), name: user.name, password_hash: passwordHash,
    role: user.role, subscription_status: 'active', plan: user.plan,
    contribution_percent: user.contributionPercent,
  }, { onConflict: 'email' }).select('*').single();
  if (error) throw error;
  return data;
}

async function seed() {
  const supabase = getSupabase();
  const charityRows = [];
  for (const charity of charities) {
    const { data, error } = await supabase.from('charities').upsert(charity, { onConflict: 'name' }).select('*').single();
    if (error) throw error;
    charityRows.push(data);
  }
  const admin = await upsertByEmail(supabase, { name: 'Admin User', email: process.env.ADMIN_EMAIL || 'admin@digitalheroes.com', password: process.env.ADMIN_PASSWORD || 'Admin123!', role: 'ADMINISTRATOR', plan: 'yearly', contributionPercent: 15 });
  const demo = await upsertByEmail(supabase, { name: 'Demo Golfer', email: process.env.DEMO_EMAIL || 'demo@digitalheroes.com', password: process.env.DEMO_PASSWORD || 'Demo123!', role: 'SUBSCRIBER', plan: 'monthly', contributionPercent: 20 });
  const charityByName = Object.fromEntries(charityRows.map((row) => [row.name, row.id]));
  for (const user of [admin, demo]) {
    const charityId = user.email === (process.env.ADMIN_EMAIL || 'admin@digitalheroes.com') ? charityByName['Youth Sports Foundation'] : charityByName['Local Care Network'];
    const { error: charityError } = await supabase.from('users').update({ charity_id: charityId }).eq('id', user.id);
    if (charityError) throw charityError;
    const amount = user.plan === 'yearly' ? 120 : 20;
    const { error } = await supabase.from('subscriptions').upsert({ user_id: user.id, status: 'active', plan: user.plan, amount, currency: 'GBP', renewal_date: new Date(Date.now() + 30 * 86400000).toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
  }
  const { data: existingScores, error: scoreError } = await supabase.from('scores').select('id').eq('user_id', demo.id);
  if (scoreError) throw scoreError;
  if (!existingScores.length) {
    const { error } = await supabase.from('scores').insert([
      { user_id: demo.id, score_date: '2026-09-20', score: 40 }, { user_id: demo.id, score_date: '2026-09-18', score: 34 },
      { user_id: demo.id, score_date: '2026-09-15', score: 31 }, { user_id: demo.id, score_date: '2026-09-10', score: 38 }, { user_id: demo.id, score_date: '2026-09-05', score: 29 },
    ]);
    if (error) throw error;
  }
  const { error: drawError } = await supabase.from('draws').upsert({
    month: '2026-09', mode: 'RANDOM', status: 'published', winning_numbers: [12, 3, 18, 27, 8],
    simulation: { mode: 'RANDOM', winningNumbers: [12, 3, 18, 27, 8], simulatedAt: new Date().toISOString() },
    result: { winningNumbers: [12, 3, 18, 27, 8], winners: [] }, published_at: new Date().toISOString(),
  }, { onConflict: 'month' });
  if (drawError) throw drawError;
  console.log(`Seeded ${charityRows.length} charities and demo accounts.`);
}

seed().catch((error) => { console.error(error.message); process.exitCode = 1; });