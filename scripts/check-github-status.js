async function check() {
  const url = `https://api.github.com/repos/bluestem16173/HVACRevenueBoost/commits/main/status`;
  const res = await fetch(url, { headers: { "User-Agent": "node-fetch" }});
  const data = await res.json();
  console.log("State:", data.state);
  data.statuses?.forEach(s => console.log(`- ${s.context}: ${s.state} - ${s.description}`));
}
check();
