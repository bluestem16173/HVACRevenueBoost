async function check() {
  const url = 'https://www.hvacrevenueboost.com/repair/las-vegas/hvac-unit-short-cycling';
  console.log('Fetching:', url);
  const res = await fetch(url);
  console.log('Status:', res.status);
  console.log('Cache Hit:', res.headers.get('x-vercel-cache'));
  console.log('Matched Route:', res.headers.get('x-matched-path'));
}
check();
