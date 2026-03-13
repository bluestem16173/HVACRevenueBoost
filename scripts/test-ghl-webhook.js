require('dotenv').config({ path: '.env.local' });

const testData = {
  name: "John Smith",
  first_name: "John",
  last_name: "Smith",
  phone: "555-0123",
  email: "john.smith@example.com",
  zip: "85001",
  urgency: "today",
  problem: "AC unit making loud grinding noise and blowing warm air.",
  city: "Phoenix",
  symptomId: "ac-blowing-warm-air",
  source: "DecisionGrid-SEO-Engine-Test"
};

const https = require('https');

async function sendTest() {
  const url = process.env.GHL_WEBHOOK_URL;
  
  if (!url) {
    console.error("❌ GHL_WEBHOOK_URL not found in .env.local");
    return;
  }

  console.log(`🚀 Sending test data to GHL: ${url}...`);

  const body = JSON.stringify(testData);
  const parsedUrl = new URL(url);

  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    res.on('data', (d) => {
      process.stdout.write(d);
    });
    res.on('end', () => {
      console.log("\n\n✅ Test payload sent successfully!");
      console.log("👉 You can now click 'Fetch Sample Requests' in GoHighLevel to map these fields.");
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Network error: ${e.message}`);
  });

  req.write(body);
  req.end();
}

sendTest();
