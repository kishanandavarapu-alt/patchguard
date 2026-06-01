const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("[supabase] ❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws,
  },
});

console.log("[supabase] ✅ Client initialized →", supabaseUrl);

module.exports = supabase;