const { getSupabase } = require('./config/supabase');

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    subscriptionStatus: row.subscription_status,
    plan: row.plan,
    charityId: row.charity_id,
    contributionPercent: row.contribution_percent,
    createdAt: row.created_at,
  };
}

function publicUser(row) {
  const user = mapUser(row);
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function mapSubscription(row) {
  return row && {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    plan: row.plan,
    amount: Number(row.amount),
    currency: row.currency,
    renewalDate: row.renewal_date,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    createdAt: row.created_at,
  };
}

function mapCharity(row) {
  return row && {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    location: row.location,
    image: row.image,
    featured: row.featured,
    active: row.active,
    upcomingEvents: row.upcoming_events || [],
    createdAt: row.created_at,
  };
}

function mapScore(row) {
  return row && { id: row.id, userId: row.user_id, date: row.score_date, score: row.score, createdAt: row.created_at };
}

function mapDraw(row) {
  return row && {
    id: row.id,
    month: row.month,
    mode: row.mode,
    status: row.status,
    winningNumbers: row.winning_numbers || [],
    jackpotRollover: Number(row.jackpot_rollover || 0),
    simulation: row.simulation,
    result: row.result,
    createdAt: row.created_at,
    publishedAt: row.published_at,
  };
}

function mapWinner(row) {
  return row && {
    id: row.id,
    drawId: row.draw_id,
    userId: row.user_id,
    matchedNumbers: row.matched_numbers,
    matchType: row.match_type,
    prize: Number(row.prize_amount || 0),
    prizeAmount: Number(row.prize_amount || 0),
    proofUrl: row.proof_url,
    verificationStatus: row.verification_status,
    payoutStatus: row.payout_status,
    createdAt: row.created_at,
  };
}

function mapPayout(row) {
  return row && {
    id: row.id,
    winnerId: row.winner_id,
    amount: Number(row.amount),
    status: row.status,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

function throwDatabaseError(error, context) {
  if (!error) return;
  const wrapped = new Error(`${context}: ${error.message}`);
  wrapped.code = error.code || 'DATABASE_ERROR';
  wrapped.details = error.details;
  throw wrapped;
}

async function selectOne(table, column, value, mapper) {
  const { data, error } = await getSupabase().from(table).select('*').eq(column, value).maybeSingle();
  if (error) throwDatabaseError(error, `Unable to read ${table}`);
  return mapper ? mapper(data) : data;
}

module.exports = {
  getSupabase,
  mapUser,
  publicUser,
  mapSubscription,
  mapCharity,
  mapScore,
  mapDraw,
  mapWinner,
  mapPayout,
  throwDatabaseError,
  selectOne,
};