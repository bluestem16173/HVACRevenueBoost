async function testDb() {
  const url = 'https://www.hvacrevenueboost.com/test-db';
  console.log('Fetching:', url);
  const res = await fetch(url);
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text.substring(0, 300));
}
testDb();
