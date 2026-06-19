const SUPABASE_URL = "https://nysgfbjueakznjhbmurr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2dmYmp1ZWFrem5qaGJtdXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NTMyMzksImV4cCI6MjA5NzMyOTIzOX0.AmWHUcRC7y9q13VmH4Ln7QxS6BsYHSZhrBLmuqPXH9Q";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

export const db = {
  async getDay(day) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/habit_logs?day=eq.${day}&select=checked`, { headers });
      const data = await r.json();
      return data.length > 0 ? data[0].checked : {};
    } catch { return {}; }
  },
  async setDay(day, checked) {
    await fetch(`${SUPABASE_URL}/rest/v1/habit_logs`, {
      method: "POST",
      headers: { ...headers, "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ day, checked, updated_at: new Date().toISOString() }),
    });
  },
  async getStreak() {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/streak?id=eq.1&select=count,last_day`, { headers });
      const data = await r.json();
      return data.length > 0 ? { count: data[0].count, lastDay: data[0].last_day } : { count: 0, lastDay: null };
    } catch { return { count: 0, lastDay: null }; }
  },
  async setStreak(count, lastDay) {
    await fetch(`${SUPABASE_URL}/rest/v1/streak?id=eq.1`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ count, last_day: lastDay }),
    });
  },
  async getAppCount() {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/streak?id=eq.1&select=app_count`, { headers });
      const data = await r.json();
      return data.length > 0 ? (data[0].app_count || 0) : 0;
    } catch { return 0; }
  },
  async setAppCount(count) {
    await fetch(`${SUPABASE_URL}/rest/v1/streak?id=eq.1`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ app_count: count }),
    });
  },
  async getMonth(year, month) {
    try {
      const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
      const r = await fetch(`${SUPABASE_URL}/rest/v1/habit_logs?day=like.${prefix}*&select=day,checked`, { headers });
      const data = await r.json();
      const obj = {};
      data.forEach(row => { obj[row.day] = row.checked; });
      return obj;
    } catch { return {}; }
  },
};
