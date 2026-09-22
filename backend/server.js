const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const { getSupabase, isSupabaseConfigured } = require('./src/config/supabase');
const {
  mapUser, publicUser, mapSubscription, mapCharity, mapScore, mapDraw, mapWinner,
  throwDatabaseError,
} = require('./src/db');
const { signToken, requireAuth, requireAdmin, requireSubscriber } = require('./src/middleware/auth');
const { validateScoreInput, pruneScores } = require('./src/services/scoreService');
const { validateContribution } = require('./src/services/charityService');
const { createDraw, simulateDraw, countMatches } = require('./src/services/drawService');
const { calculatePrizePool, calculateWinners } = require('./src/services/prizeService');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

function handleError(res, error, message) {
  console.error(message, error.message);
  if (error.code === 'SUPABASE_NOT_CONFIGURED') return res.status(503).json({ message: 'Database is not configured.' });
  if (error.code === '23505') return res.status(409).json({ message: 'That record already exists.' });
  return res.status(500).json({ message });
}

async function readRows(table, mapper, queryBuilder) {
  let query = getSupabase().from(table).select('*');
  if (queryBuilder) query = queryBuilder(query);
  const { data, error } = await query;
  if (error) throwDatabaseError(error, `Unable to read ${table}`);
  return (data || []).map(mapper);
}

async function readOne(table, column, value, mapper = (row) => row) {
  const { data, error } = await getSupabase().from(table).select('*').eq(column, value).maybeSingle();
  if (error) throwDatabaseError(error, `Unable to read ${table}`);
  return mapper(data);
}

function safeUserFromRequest(user) {
  return publicUser({
    id: user.id, name: user.name, email: user.email, password_hash: user.passwordHash,
    role: user.role, subscription_status: user.subscriptionStatus, plan: user.plan,
    charity_id: user.charityId, contribution_percent: user.contributionPercent, created_at: user.createdAt,
  });
}

function isValidDrawMonth(month) {
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return false;
  const [year, monthNumber] = month.split('-').map(Number);
  return year >= 2000 && year <= 9999 && monthNumber >= 1 && monthNumber <= 12;
}

app.get('/api/health', async (req, res) => {
  if (!isSupabaseConfigured()) return res.status(503).json({ ok: false, database: 'not_configured', message: 'Digital Heroes API is running, but Supabase is not configured.' });
  try {
    const { error } = await getSupabase().from('users').select('id', { head: true, count: 'exact' });
    if (error) throw error;
    return res.json({ ok: true, database: 'connected', message: 'Digital Heroes API is running.' });
  } catch (error) {
    console.error('Health database check failed:', error.message);
    return res.status(503).json({ ok: false, database: 'unavailable', message: 'Digital Heroes API is running, but the database is unavailable.' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, charityId, contributionPercent = 10 } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
    const contributionValidation = validateContribution({ percent: Number(contributionPercent) });
    if (!contributionValidation.valid) return res.status(400).json({ message: contributionValidation.error });
    const normalizedEmail = String(email).trim().toLowerCase();
    const supabase = getSupabase();
    const { data: existing, error: lookupError } = await supabase.from('users').select('id').eq('email', normalizedEmail).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return res.status(409).json({ message: 'An account with that email already exists.' });
    if (charityId) {
      const { data: charity, error } = await supabase.from('charities').select('id').eq('id', charityId).eq('active', true).maybeSingle();
      if (error) throw error;
      if (!charity) return res.status(400).json({ message: 'Selected charity was not found.' });
    }
    const { data: row, error } = await supabase.from('users').insert({
      name, email: normalizedEmail, password_hash: await bcrypt.hash(password, 10), role: 'SUBSCRIBER',
      charity_id: charityId || null, contribution_percent: Number(contributionPercent), subscription_status: 'inactive', plan: 'monthly',
    }).select('*').single();
    if (error) throw error;
    const { error: subscriptionError } = await supabase.from('subscriptions').insert({ user_id: row.id, status: 'inactive', plan: 'monthly', amount: 20, currency: 'GBP', renewal_date: new Date(Date.now() + 30 * 86400000).toISOString() });
    if (subscriptionError) throw subscriptionError;
    return res.status(201).json({ token: signToken(mapUser(row)), user: publicUser(row) });
  } catch (error) { return handleError(res, error, 'Unable to create subscriber account.'); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const row = await readOne('users', 'email', String(email).trim().toLowerCase());
    if (!row) return res.status(401).json({ message: 'Invalid email or password.' });
    const user = mapUser(row);
    if (!(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password.' });
    return res.json({ token: signToken(user), user: publicUser(row) });
  } catch (error) { return handleError(res, error, 'Login failed.'); }
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: safeUserFromRequest(req.user) }));

app.get('/api/charities', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const category = String(req.query.category || '').trim();
    return res.json({ charities: await readRows('charities', mapCharity, (query) => {
      let next = query.eq('active', true);
      if (search) next = next.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
      if (category) next = next.eq('category', category);
      return next.order('featured', { ascending: false }).order('name');
    }) });
  }
  catch (error) { return handleError(res, error, 'Unable to load charities.'); }
});

app.get('/api/charities/:id', async (req, res) => {
  try { const charity = await readOne('charities', 'id', req.params.id, mapCharity); if (!charity) return res.status(404).json({ message: 'Charity not found.' }); return res.json({ charity }); }
  catch (error) { return handleError(res, error, 'Unable to load charity.'); }
});

app.post('/api/charities', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await getSupabase().from('charities').insert({
      name: req.body.name, category: req.body.category || 'General', description: req.body.description || '', location: req.body.location || 'United Kingdom',
      image: req.body.image || null, featured: Boolean(req.body.featured), active: true, upcoming_events: req.body.upcomingEvents || [],
    }).select('*').single();
    if (error) throw error;
    return res.status(201).json({ charity: mapCharity(data) });
  } catch (error) { return handleError(res, error, 'Unable to create charity.'); }
});

app.get('/api/admin/charities', requireAuth, requireAdmin, async (req, res) => {
  try { return res.json({ charities: await readRows('charities', mapCharity, (query) => query.order('active', { ascending: false }).order('name')) }); }
  catch (error) { return handleError(res, error, 'Unable to load admin charities.'); }
});

app.put('/api/charities/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updates = {};
    ['name', 'category', 'description', 'location', 'image', 'featured', 'active'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (req.body.upcomingEvents !== undefined) updates.upcoming_events = req.body.upcomingEvents;
    const { data, error } = await getSupabase().from('charities').update(updates).eq('id', req.params.id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Charity not found.' });
    return res.json({ charity: mapCharity(data) });
  } catch (error) { return handleError(res, error, 'Unable to update charity.'); }
});

app.delete('/api/charities/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await getSupabase().from('charities').update({ active: false }).eq('id', req.params.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Charity not found.' });
    return res.json({ ok: true, message: 'Charity archived.' });
  } catch (error) { return handleError(res, error, 'Unable to archive charity.'); }
});

app.patch('/api/users/me/preferences', requireAuth, async (req, res) => {
  try {
    const contributionPercent = Number(req.body.contributionPercent);
    const validation = validateContribution({ percent: contributionPercent });
    if (!validation.valid) return res.status(400).json({ message: validation.error });
    const { data: charity, error: charityError } = await getSupabase().from('charities').select('id').eq('id', req.body.charityId).eq('active', true).maybeSingle();
    if (charityError) throw charityError;
    if (!charity) return res.status(400).json({ message: 'Selected charity was not found.' });
    const { data, error } = await getSupabase().from('users').update({ charity_id: charity.id, contribution_percent: contributionPercent }).eq('id', req.user.id).select('*').single();
    if (error) throw error;
    return res.json({ user: publicUser(data) });
  } catch (error) { return handleError(res, error, 'Unable to update charity preferences.'); }
});

app.post('/api/donations', requireAuth, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Donation amount must be greater than zero.' });
    const { data: charity, error: charityError } = await getSupabase().from('charities').select('id').eq('id', req.body.charityId).eq('active', true).maybeSingle();
    if (charityError) throw charityError;
    if (!charity) return res.status(400).json({ message: 'Selected charity was not found.' });
    const { data, error } = await getSupabase().from('donations').insert({ user_id: req.user.id, charity_id: charity.id, amount, currency: 'GBP', status: 'pending' }).select('*').single();
    if (error) throw error;
    return res.status(201).json({ donation: { id: data.id, charityId: data.charity_id, amount: Number(data.amount), currency: data.currency, status: data.status, createdAt: data.created_at } });
  } catch (error) { return handleError(res, error, 'Unable to record donation.'); }
});

app.get('/api/scores', requireAuth, requireSubscriber, async (req, res) => {
  try { return res.json({ scores: await readRows('scores', mapScore, (query) => query.eq('user_id', req.user.id).order('score_date', { ascending: false })) }); }
  catch (error) { return handleError(res, error, 'Unable to load scores.'); }
});

app.post('/api/scores', requireAuth, requireSubscriber, async (req, res) => {
  try {
    const score = Number(req.body.score); const date = req.body.date;
    const existing = await readRows('scores', mapScore, (query) => query.eq('user_id', req.user.id).order('score_date', { ascending: false }));
    const validation = validateScoreInput({ score, date, existingScores: existing });
    if (!validation.valid) return res.status(400).json({ message: validation.error });
    const { data, error } = await getSupabase().from('scores').insert({ user_id: req.user.id, score, score_date: date }).select('*').single();
    if (error) throw error;
    const newScore = mapScore(data); const retained = pruneScores([newScore, ...existing]);
    const removed = [newScore, ...existing].filter((entry) => !retained.some((item) => item.id === entry.id));
    if (removed.length) { const { error: deleteError } = await getSupabase().from('scores').delete().in('id', removed.map((entry) => entry.id)); if (deleteError) throw deleteError; }
    return res.status(201).json({ score: newScore });
  } catch (error) { return handleError(res, error, 'Unable to save score.'); }
});

app.put('/api/scores/:date', requireAuth, requireSubscriber, async (req, res) => {
  try {
    const score = Number(req.body.score);
    if (!Number.isInteger(score) || score < 1 || score > 45) return res.status(400).json({ message: 'Score must be between 1 and 45.' });
    const { data, error } = await getSupabase().from('scores').update({ score }).eq('user_id', req.user.id).eq('score_date', req.params.date).select('*').maybeSingle();
    if (error) throw error; if (!data) return res.status(404).json({ message: 'Score not found.' });
    return res.json({ ok: true, message: 'Score updated.', score: mapScore(data) });
  } catch (error) { return handleError(res, error, 'Unable to update score.'); }
});

app.delete('/api/scores/:date', requireAuth, requireSubscriber, async (req, res) => {
  try { const { error } = await getSupabase().from('scores').delete().eq('user_id', req.user.id).eq('score_date', req.params.date); if (error) throw error; return res.json({ ok: true, message: 'Score deleted.' }); }
  catch (error) { return handleError(res, error, 'Unable to delete score.'); }
});

app.get('/api/subscriptions', requireAuth, async (req, res) => {
  try { return res.json({ subscriptions: await readRows('subscriptions', mapSubscription, (query) => query.eq('user_id', req.user.id).order('created_at', { ascending: false })) }); }
  catch (error) { return handleError(res, error, 'Unable to load subscriptions.'); }
});

app.post('/api/subscriptions', requireAuth, async (req, res) => {
  try {
    const plan = req.body.plan === 'yearly' ? 'yearly' : 'monthly'; const amount = plan === 'yearly' ? 120 : 20;
    const supabase = getSupabase();
    const { data, error } = await supabase.from('subscriptions').upsert({ user_id: req.user.id, status: 'active', plan, amount, currency: 'GBP', renewal_date: new Date(Date.now() + 30 * 86400000).toISOString() }, { onConflict: 'user_id' }).select('*').single();
    if (error) throw error;
    const { data: userRow, error: userError } = await supabase.from('users').update({ plan, subscription_status: 'active' }).eq('id', req.user.id).select('*').single();
    if (userError) throw userError;
    return res.json({ subscription: mapSubscription(data), user: publicUser(userRow) });
  } catch (error) { return handleError(res, error, 'Unable to update subscription.'); }
});

app.patch('/api/subscriptions/:id', requireAuth, async (req, res) => {
  try {
    const allowedStatuses = ['active', 'past_due', 'cancelled', 'expired', 'incomplete', 'inactive'];
    if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({ message: 'Invalid subscription status.' });
    const { data, error } = await getSupabase().from('subscriptions').update({ status: req.body.status }).eq('id', req.params.id).eq('user_id', req.user.id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Subscription not found.' });
    const { data: userRow, error: userError } = await getSupabase().from('users').update({ subscription_status: data.status }).eq('id', req.user.id).select('*').single();
    if (userError) throw userError;
    return res.json({ subscription: mapSubscription(data), user: publicUser(userRow) });
  } catch (error) { return handleError(res, error, 'Unable to update subscription status.'); }
});

app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const [{ data: subscriptions, error: subscriptionError }, { data: draws, error: drawError }, { data: winners, error: winnerError }] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }),
      supabase.from('draws').select('id, month, status, published_at').order('month', { ascending: false }),
      supabase.from('winners').select('prize_amount, payout_status, verification_status').eq('user_id', req.user.id),
    ]);
    if (subscriptionError) throw subscriptionError;
    if (drawError) throw drawError;
    if (winnerError) throw winnerError;
    const totalWon = (winners || []).reduce((total, winner) => total + Number(winner.prize_amount || 0), 0);
    return res.json({
      participation: { drawsEntered: req.user.subscriptionStatus === 'active' ? (draws || []).filter((draw) => draw.status === 'published').length : 0, upcomingDraws: (draws || []).filter((draw) => draw.status !== 'published') },
      winnings: { totalWon, winners: winners || [], currentPaymentStatus: winners?.some((winner) => winner.payout_status === 'pending') ? 'pending' : 'none' },
      subscriptions: (subscriptions || []).map(mapSubscription),
    });
  } catch (error) { return handleError(res, error, 'Unable to load dashboard summary.'); }
});

app.get('/api/admin/overview', requireAuth, requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const results = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'SUBSCRIBER').eq('subscription_status', 'active'),
      supabase.from('charities').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('draws').select('id', { count: 'exact', head: true }),
    ]);
    results.forEach(({ error }) => { if (error) throw error; });
    const [users, activeSubscribers, charities, draws] = results.map((result) => result.count || 0);
    return res.json({ totals: { users, activeSubscribers, prizePool: calculatePrizePool({ activeSubscribers, monthlyFee: 20 }).total }, charities, draws });
  } catch (error) { return handleError(res, error, 'Unable to load admin overview.'); }
});

app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => { try { return res.json({ users: await readRows('users', publicUser) }); } catch (error) { return handleError(res, error, 'Unable to load users.'); } });
app.get('/api/admin/subscriptions', requireAuth, requireAdmin, async (req, res) => { try { return res.json({ subscriptions: await readRows('subscriptions', mapSubscription) }); } catch (error) { return handleError(res, error, 'Unable to load subscriptions.'); } });
app.get('/api/admin/draws', requireAuth, requireAdmin, async (req, res) => { try { return res.json({ draws: await readRows('draws', mapDraw, (query) => query.order('created_at', { ascending: false })) }); } catch (error) { return handleError(res, error, 'Unable to load draws.'); } });

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.role !== undefined && ['SUBSCRIBER', 'ADMINISTRATOR'].includes(req.body.role)) updates.role = req.body.role;
    if (req.body.subscriptionStatus !== undefined && ['active', 'past_due', 'cancelled', 'expired', 'incomplete', 'inactive'].includes(req.body.subscriptionStatus)) updates.subscription_status = req.body.subscriptionStatus;
    if (req.body.charityId !== undefined) updates.charity_id = req.body.charityId || null;
    if (req.body.contributionPercent !== undefined) updates.contribution_percent = Number(req.body.contributionPercent);
    const { data, error } = await getSupabase().from('users').update(updates).eq('id', req.params.id).select('*').maybeSingle();
    if (error) throw error; if (!data) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user: publicUser(data) });
  } catch (error) { return handleError(res, error, 'Unable to update user.'); }
});

app.patch('/api/admin/subscriptions/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allowedStatuses = ['active', 'past_due', 'cancelled', 'expired', 'incomplete', 'inactive'];
    const updates = {};
    if (allowedStatuses.includes(req.body.status)) updates.status = req.body.status;
    if (['monthly', 'yearly', 'pro'].includes(req.body.plan)) updates.plan = req.body.plan;
    if (req.body.renewalDate !== undefined) updates.renewal_date = req.body.renewalDate;
    const { data, error } = await getSupabase().from('subscriptions').update(updates).eq('id', req.params.id).select('*').maybeSingle();
    if (error) throw error; if (!data) return res.status(404).json({ message: 'Subscription not found.' });
    await getSupabase().from('users').update({ subscription_status: data.status, plan: data.plan }).eq('id', data.user_id);
    return res.json({ subscription: mapSubscription(data) });
  } catch (error) { return handleError(res, error, 'Unable to update subscription.'); }
});

app.get('/api/admin/reports', requireAuth, requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const [{ data: users, error: usersError }, { data: subscriptions, error: subscriptionsError }, { data: donations, error: donationsError }, { data: draws, error: drawsError }, { data: winners, error: winnersError }] = await Promise.all([
      supabase.from('users').select('id, charity_id, subscription_status, contribution_percent'),
      supabase.from('subscriptions').select('user_id, status, plan, amount'),
      supabase.from('donations').select('charity_id, amount, status'),
      supabase.from('draws').select('id, status, month'),
      supabase.from('winners').select('prize_amount, payout_status, verification_status'),
    ]);
    [usersError, subscriptionsError, donationsError, drawsError, winnersError].forEach((error) => { if (error) throw error; });
    const subscriptionBreakdown = (subscriptions || []).reduce((result, item) => { result[item.status] = (result[item.status] || 0) + 1; return result; }, {});
    const usersById = Object.fromEntries((users || []).map((user) => [user.id, user]));
    const charityContributions = (donations || []).reduce((result, item) => { result[item.charity_id] = (result[item.charity_id] || 0) + Number(item.amount || 0); return result; }, {});
    (subscriptions || []).filter((subscription) => subscription.status === 'active').forEach((subscription) => { const user = usersById[subscription.user_id]; if (user?.charity_id) charityContributions[user.charity_id] = (charityContributions[user.charity_id] || 0) + (Number(subscription.amount || 0) * Number(user.contribution_percent || 10) / 100); });
    return res.json({ totals: { users: users.length, activeSubscribers: users.filter((user) => user.subscription_status === 'active').length, prizePool: users.filter((user) => user.subscription_status === 'active').length * 20, draws: draws.length, winners: winners.length, paidOut: winners.filter((winner) => winner.payout_status === 'paid').length }, subscriptionBreakdown, charityContributions, drawStatistics: { published: draws.filter((draw) => draw.status === 'published').length, simulated: draws.filter((draw) => draw.status === 'simulated').length }, payoutStatus: winners.reduce((result, winner) => { result[winner.payout_status] = (result[winner.payout_status] || 0) + 1; return result; }, {}) });
  } catch (error) { return handleError(res, error, 'Unable to load reports.'); }
});

app.post('/api/admin/draws/simulate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const month = req.body.month || new Date().toISOString().slice(0, 7); const mode = req.body.mode === 'ALGORITHMIC' ? 'ALGORITHMIC' : 'RANDOM';
    if (!isValidDrawMonth(month)) return res.status(400).json({ message: 'Draw month must use YYYY-MM format.' });
    let scoreEntries = [];
    if (mode === 'ALGORITHMIC') {
      const { data, error: scoreError } = await getSupabase().from('scores').select('score');
      if (scoreError) throw scoreError;
      scoreEntries = data || [];
    }
    const simulation = simulateDraw({ mode, numbers: req.body.numbers, scoreEntries });
    const { data, error } = await getSupabase().from('draws').insert({ month, mode, status: 'simulated', winning_numbers: simulation.winningNumbers, simulation }).select('*').single();
    if (error) throw error; return res.status(201).json({ draw: mapDraw(data) });
  } catch (error) { return handleError(res, error, 'Unable to simulate draw.'); }
});

app.post('/api/admin/draws/publish', requireAuth, requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabase(); const draw = await readOne('draws', 'id', req.body.drawId);
    if (!draw) return res.status(404).json({ message: 'Draw not found.' });
    if (draw.status === 'published') return res.status(409).json({ message: 'This draw has already been published.' });
    const { data: subscribers, error: subscriberError } = await supabase.from('users').select('id').eq('role', 'SUBSCRIBER').eq('subscription_status', 'active');
    if (subscriberError) throw subscriberError;
    const { data: previousDraw, error: previousDrawError } = await supabase.from('draws').select('jackpot_rollover').eq('status', 'published').neq('id', draw.id).order('month', { ascending: false }).limit(1).maybeSingle();
    if (previousDrawError) throw previousDrawError;
    const prizePool = calculatePrizePool({ activeSubscribers: (subscribers || []).length, monthlyFee: 20, jackpotRollover: previousDraw?.jackpot_rollover || 0 });
    const { data: scores, error: scoreError } = await supabase.from('scores').select('user_id, score, score_date').in('user_id', (subscribers || []).map((entry) => entry.id)).order('score_date', { ascending: false });
    if (scoreError) throw scoreError;
    const scoresByUser = (scores || []).reduce((groups, entry) => { groups[entry.user_id] = groups[entry.user_id] || []; if (groups[entry.user_id].length < 5) groups[entry.user_id].push(entry); return groups; }, {});
    const winningNumbers = draw.simulation?.winningNumbers || draw.winning_numbers || [];
    const entries = Object.entries(scoresByUser).map(([userId, userScores]) => ({ userId, numbers: userScores.map((entry) => entry.score), matchedNumbers: countMatches(userScores.map((entry) => entry.score), winningNumbers) }));
    const winners = Object.entries(prizePool.tiers).flatMap(([tier, value]) => calculateWinners({ entries, prizePot: value.amount, tier }));
    const winnerRows = winners.map((winner) => ({ draw_id: draw.id, user_id: winner.userId, matched_numbers: winner.matchedNumbers, match_type: String(winner.matchedNumbers), prize_amount: winner.prize, verification_status: 'pending', payout_status: 'pending' }));
    let savedWinners = [];
    if (winnerRows.length) { const { data, error } = await supabase.from('winners').insert(winnerRows).select('*'); if (error) throw error; savedWinners = data.map(mapWinner); }
    const hasJackpotWinner = winners.some((winner) => winner.matchedNumbers === 5);
    const jackpotRollover = hasJackpotWinner ? 0 : prizePool.tiers['5'].amount;
    const result = { winners: savedWinners, winningNumbers: draw.simulation?.winningNumbers || draw.winning_numbers || [] };
    const { data: published, error } = await supabase.from('draws').update({ status: 'published', result, jackpot_rollover: jackpotRollover, published_at: new Date().toISOString() }).eq('id', draw.id).select('*').single();
    if (error) throw error; return res.json({ draw: mapDraw(published) });
  } catch (error) { return handleError(res, error, 'Unable to publish draw.'); }
});

app.get('/api/draws', async (req, res) => { try { return res.json({ draws: await readRows('draws', mapDraw, (query) => query.order('created_at', { ascending: false })) }); } catch (error) { return handleError(res, error, 'Unable to load draws.'); } });
app.get('/api/draws/:id', async (req, res) => { try { const draw = await readOne('draws', 'id', req.params.id, mapDraw); if (!draw) return res.status(404).json({ message: 'Draw not found.' }); return res.json({ draw }); } catch (error) { return handleError(res, error, 'Unable to load draw.'); } });

app.get('/api/winners', requireAuth, async (req, res) => {
  try { return res.json({ winners: await readRows('winners', mapWinner, (query) => req.user.role === 'ADMINISTRATOR' ? query : query.eq('user_id', req.user.id)) }); }
  catch (error) { return handleError(res, error, 'Unable to load winners.'); }
});

async function updateWinner(req, res, changes, message, ownerId) {
  try {
    let query = getSupabase().from('winners').update(changes).eq('id', req.params.id);
    if (ownerId) query = query.eq('user_id', ownerId);
    const { data, error } = await query.select('*').maybeSingle();
    if (error) throw error; if (!data) return res.status(404).json({ message: 'Winner record not found.' });
    return res.json({ winner: mapWinner(data) });
  } catch (error) { return handleError(res, error, message); }
}

app.post('/api/winners/:id/proof', requireAuth, async (req, res) => updateWinner(req, res, { proof_url: req.body.proofUrl, verification_status: 'pending' }, 'Unable to submit winner proof.', req.user.id));
app.patch('/api/winners/:id/approve', requireAuth, requireAdmin, async (req, res) => updateWinner(req, res, { verification_status: 'approved', payout_status: 'pending' }, 'Unable to approve winner.'));
app.patch('/api/winners/:id/reject', requireAuth, requireAdmin, async (req, res) => updateWinner(req, res, { verification_status: 'rejected', payout_status: 'rejected' }, 'Unable to reject winner.'));
app.patch('/api/winners/:id/pay', requireAuth, requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: winner, error } = await supabase.from('winners').update({ payout_status: 'paid' }).eq('id', req.params.id).eq('verification_status', 'approved').select('*').maybeSingle();
    if (error) throw error; if (!winner) return res.status(404).json({ message: 'Approved winner record not found.' });
    const { error: payoutError } = await supabase.from('payouts').upsert({ winner_id: winner.id, amount: winner.prize_amount, status: 'paid', paid_at: new Date().toISOString() }, { onConflict: 'winner_id' });
    if (payoutError) throw payoutError; return res.json({ winner: mapWinner(winner) });
  } catch (error) { return handleError(res, error, 'Unable to mark winner as paid.'); }
});

app.post('/api/payments/checkout', requireAuth, (req, res) => {
  const plan = req.body.plan === 'yearly' ? 'yearly' : 'monthly';
  const priceId = plan === 'yearly' ? process.env.STRIPE_YEARLY_PRICE_ID : process.env.STRIPE_MONTHLY_PRICE_ID;
  if (!process.env.STRIPE_SECRET_KEY || !priceId) return res.status(503).json({ message: 'Stripe checkout is not configured.' });
  return res.status(501).json({ message: 'Stripe checkout requires the payment integration to be enabled.' });
});
app.post('/api/payments/webhook', (req, res) => res.status(501).json({ message: 'Stripe webhooks are not configured.' }));
app.get('/api/users/me', requireAuth, (req, res) => res.json({ user: safeUserFromRequest(req.user) }));

app.use((error, req, res, next) => { console.error(error); return res.status(500).json({ message: 'An unexpected server error occurred.' }); });

if (require.main === module) app.listen(PORT, () => console.log(`Digital Heroes API running on http://localhost:${PORT}`));

module.exports = app;
