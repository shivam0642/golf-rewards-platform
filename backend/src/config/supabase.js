const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(url && serviceRoleKey && !url.includes('your-project') && !serviceRoleKey.includes('your-service-role-key'));

const supabase = configured
  ? createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;

function getSupabase() {
  if (!supabase) {
    const error = new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    error.code = 'SUPABASE_NOT_CONFIGURED';
    throw error;
  }

  return supabase;
}

function isSupabaseConfigured() {
  return configured;
}

module.exports = { getSupabase, isSupabaseConfigured };